import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  configuracaoWhatsapp: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  envioAutomaticoWhatsapp: {
    create: vi.fn(),
  },
}));

vi.mock("../web/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  conectarEvolution,
  desconectarEvolution,
  enviarMensagemEvolution,
  obterStatusEvolution,
} from "../web/services/servico_evolution";

const envOriginal = { ...process.env };

function respostaJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function configuracaoWhatsapp(overrides: Record<string, unknown> = {}) {
  return {
    id: "config",
    chave: "principal",
    ativo: true,
    conectado: false,
    numeroConectado: null,
    numeroAviso: null,
    mensagemPrimeiroContato: "Descreva seu problema desta forma, em uma única mensagem:",
    mensagemConfirmacaoChamado: "Chamado {protocolo} criado para {assunto} no setor {setor}.",
    ultimaSolicitacaoQrEm: null,
    novaTentativaQrEm: null,
    conectadoEm: null,
    desconectadoEm: null,
    ...overrides,
  };
}

beforeEach(() => {
  process.env = {
    ...envOriginal,
    EVOLUTION_API_HABILITADA: "true",
    EVOLUTION_API_URL: "https://evolution.local",
    EVOLUTION_API_CHAVE: "chave-teste",
    EVOLUTION_API_INSTANCIA: "",
    EVOLUTION_WEBHOOK_URL: "https://teste-codificar.vercel.app/api/evolution/webhook",
    EVOLUTION_WEBHOOK_SEGREDO: "segredo-teste",
  };
  prismaMock.configuracaoWhatsapp.upsert.mockResolvedValue(configuracaoWhatsapp());
  prismaMock.configuracaoWhatsapp.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    configuracaoWhatsapp(data),
  );
  prismaMock.envioAutomaticoWhatsapp.create.mockResolvedValue({ id: "envio" });
});

afterEach(() => {
  process.env = { ...envOriginal };
  vi.unstubAllGlobals();
});

describe("servico_evolution", () => {
  it("obterStatusEvolution consulta estado da instância padrão", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(respostaJson({ instance: { state: "OPEN" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(obterStatusEvolution()).resolves.toMatchObject({
      sucesso: true,
      dados: {
        instanciaNome: "teste_cod_01",
        estado: "conectada",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/instance/connectionState/teste_cod_01",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("conectarEvolution cria instância, configura webhook e retorna QR Code", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(respostaJson({
        qrcode: { base64: "data:image/png;base64,abc" },
        instance: { state: "connecting" },
      }))
      .mockResolvedValueOnce(respostaJson({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(conectarEvolution()).resolves.toMatchObject({
      sucesso: true,
      dados: {
        instanciaNome: "teste_cod_01",
        estado: "conectando",
        qrcodeBase64: "data:image/png;base64,abc",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/instance/create",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"instanceName\":\"teste_cod_01\""),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/webhook/set/teste_cod_01",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("https://teste-codificar.vercel.app/api/evolution/webhook"),
      }),
    );
  });

  it("conectarEvolution usa connect quando a instância já existe", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(respostaJson({ message: "exists" }, 409))
      .mockResolvedValueOnce(respostaJson({
        qrcode: { base64: "data:image/png;base64,def" },
        instance: { state: "connecting" },
      }))
      .mockResolvedValueOnce(respostaJson({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(conectarEvolution()).resolves.toMatchObject({
      sucesso: true,
      dados: { qrcodeBase64: "data:image/png;base64,def" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/instance/connect/teste_cod_01",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("desconectarEvolution exclui a instância única", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(respostaJson({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(desconectarEvolution()).resolves.toMatchObject({
      sucesso: true,
      dados: { estado: "desconectada" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/instance/delete/teste_cod_01",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("conectarEvolution bloqueia segunda tentativa antes de 60 segundos", async () => {
    const novaTentativaQrEm = new Date(Date.now() + 45_000);
    prismaMock.configuracaoWhatsapp.upsert.mockResolvedValueOnce(configuracaoWhatsapp({ novaTentativaQrEm }));
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(conectarEvolution()).resolves.toMatchObject({
      sucesso: true,
      dados: {
        bloqueadoPorRateLimit: true,
        novaTentativaQrEm,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enviarMensagemEvolution envia texto e registra envio automático", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(respostaJson({ key: { id: "msg-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      enviarMensagemEvolution({
        destinatario: "55 (11) 99999-9999",
        conteudo: "Mensagem automática",
        tipo: "PROTOCOLO",
        sessaoWhatsappId: "sessao",
        chamadoId: "chamado",
      }),
    ).resolves.toEqual({ sucesso: true, dados: { identificadorExterno: "msg-1" } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evolution.local/message/sendText/teste_cod_01",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ number: "5511999999999", text: "Mensagem automática" }),
      }),
    );
    expect(prismaMock.envioAutomaticoWhatsapp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          identificadorExterno: "msg-1",
          tipo: "PROTOCOLO",
          destinatario: "5511999999999",
        }),
      }),
    );
  });

  it("retorna erro quando a integração está desabilitada", async () => {
    process.env.EVOLUTION_API_HABILITADA = "false";

    await expect(obterStatusEvolution()).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Integração Evolution API desabilitada.",
    });
  });
});
