import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  configuracaoWhatsapp: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  sessaoWhatsapp: {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  conversa: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  envioAutomaticoWhatsapp: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

const evolutionMock = vi.hoisted(() => ({
  enviarMensagemEvolution: vi.fn(),
}));

const intencaoMock = vi.hoisted(() => ({
  analisarMensagemIntentSolver: vi.fn(),
}));

const chamadoMock = vi.hoisted(() => ({
  criarChamadoComDistribuicao: vi.fn(),
}));

vi.mock("../web/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../web/services/servico_evolution", () => evolutionMock);
vi.mock("../web/modules/intents/servico_intencao", () => intencaoMock);
vi.mock("../web/modules/tickets/servico_chamado", () => chamadoMock);
vi.mock("../web/utils/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

import {
  extrairSolicitacaoWhatsapp,
  mensagemPrimeiroContatoValida,
} from "../web/services/servico_processamento_mensagem";
import {
  obterConfiguracaoWhatsapp,
  registrarSolicitacaoQrWhatsapp,
  salvarConfiguracaoWhatsapp,
} from "../web/services/servico_configuracao_whatsapp";
import { processarWebhookWhatsapp } from "../web/services/servico_atendimento_whatsapp";
import { processarAgendamentosWhatsapp } from "../web/services/servico_agendamento_whatsapp";

const agora = new Date("2026-06-14T12:00:00.000Z");

function configuracao(overrides: Record<string, unknown> = {}) {
  return {
    id: "config",
    chave: "principal",
    ativo: true,
    conectado: true,
    numeroConectado: "5511888888888",
    numeroAviso: null,
    mensagemPrimeiroContato: "Informe seu nome:\nAssunto:\nDescrição do problema:",
    ultimaSolicitacaoQrEm: null,
    novaTentativaQrEm: null,
    conectadoEm: null,
    desconectadoEm: null,
    ...overrides,
  };
}

function sessao(overrides: Record<string, unknown> = {}) {
  return {
    id: "sessao",
    telefoneCliente: "5511999999999",
    estado: "AGUARDANDO_DADOS",
    chamadoId: null,
    expiraEm: new Date("2026-06-14T12:10:00.000Z"),
    ...overrides,
  };
}

function chamado() {
  return {
    id: "chamado",
    protocolo: "CHA-20260614-A1B2C3",
    titulo: "Computador não liga",
    descricao: "Computador não liga após queda de energia.",
    assunto: "Computador não liga",
    solicitanteNome: "João da Silva",
    solicitanteTelefone: "5511999999999",
    prioridade: "ALTA",
    status: "ABERTO",
    origem: "WHATSAPP",
    setorId: "setor-ti",
    responsavelId: null,
    intencaoId: "intencao",
    confiancaIntencao: 0.9,
    dataAbertura: agora,
    dataAtualizacao: agora,
    dataResolucao: null,
    dataFechamento: null,
    setor: { id: "setor-ti", nome: "Tecnologia da Informação" },
    responsavel: null,
    intencao: { id: "intencao", nome: "Problema com computador" },
  };
}

function payloadMensagem(texto: string, id = "msg-1", fromMe = false) {
  return {
    event: "MESSAGES_UPSERT",
    instance: "teste_cod_01",
    data: {
      key: {
        id,
        remoteJid: "5511999999999@s.whatsapp.net",
        fromMe,
      },
      pushName: "João",
      message: { conversation: texto },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.EVOLUTION_API_HABILITADA = "true";
  process.env.EVOLUTION_API_INSTANCIA = "teste_cod_01";
  prismaMock.configuracaoWhatsapp.upsert.mockResolvedValue(configuracao());
  prismaMock.configuracaoWhatsapp.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    configuracao(data),
  );
  prismaMock.sessaoWhatsapp.updateMany.mockResolvedValue({ count: 0 });
  prismaMock.sessaoWhatsapp.findFirst.mockResolvedValue(null);
  prismaMock.sessaoWhatsapp.create.mockResolvedValue({ id: "sessao" });
  prismaMock.sessaoWhatsapp.update.mockResolvedValue({ id: "sessao" });
  prismaMock.sessaoWhatsapp.findMany.mockResolvedValue([]);
  prismaMock.conversa.findUnique.mockResolvedValue(null);
  prismaMock.conversa.create.mockResolvedValue({ id: "conversa" });
  prismaMock.envioAutomaticoWhatsapp.findFirst.mockResolvedValue(null);
  prismaMock.envioAutomaticoWhatsapp.create.mockResolvedValue({ id: "envio" });
  evolutionMock.enviarMensagemEvolution.mockResolvedValue({ sucesso: true, dados: { identificadorExterno: "auto-1" } });
  intencaoMock.analisarMensagemIntentSolver.mockResolvedValue({
    sucesso: true,
    dados: {
      identificada: true,
      intencaoId: "intencao",
      nomeIntencao: "Problema com computador",
      assuntoSugerido: "Computador com defeito",
      tituloSugerido: "Computador com defeito",
      setorId: "setor-ti",
      setorNome: "Tecnologia da Informação",
      prioridadeSugerida: "ALTA",
      confianca: 0.9,
      termosEncontrados: ["computador"],
    },
  });
  chamadoMock.criarChamadoComDistribuicao.mockResolvedValue({ sucesso: true, dados: chamado() });
});

describe("parser de WhatsApp", () => {
  it("extrai formato válido com descrição em várias linhas", () => {
    const resultado = extrairSolicitacaoWhatsapp([
      "Informe seu nome: João da Silva",
      "Assunto: Computador não liga",
      "Descrição do problema: Parou após queda de energia.",
      "A luz do gabinete não acende.",
    ].join("\n"));

    expect(resultado).toEqual({
      valida: true,
      nome: "João da Silva",
      assunto: "Computador não liga",
      descricao: "Parou após queda de energia.\nA luz do gabinete não acende.",
    });
  });

  it("aceita labels sem acentuação e em maiúsculas", () => {
    const resultado = extrairSolicitacaoWhatsapp("NOME: Ana\nASSUNTO: Rede\nDESCRICAO: Sem internet");

    expect(resultado).toMatchObject({ valida: true, nome: "Ana", assunto: "Rede" });
  });

  it("rejeita nome ausente, descrição ausente e texto fora de ordem", () => {
    expect(extrairSolicitacaoWhatsapp("Nome:\nAssunto: Rede\nDescrição: Sem internet")).toMatchObject({
      valida: false,
      camposAusentes: ["nome"],
    });
    expect(extrairSolicitacaoWhatsapp("Nome: Ana\nAssunto: Rede\nDescrição:")).toMatchObject({
      valida: false,
      camposAusentes: ["descricao"],
    });
    expect(extrairSolicitacaoWhatsapp("Assunto: Rede\nNome: Ana\nDescrição: Sem internet")).toMatchObject({
      valida: false,
      camposAusentes: expect.arrayContaining(["nome", "assunto"]),
    });
  });
});

describe("configuração do WhatsApp", () => {
  it("cria ou consulta apenas a configuração principal", async () => {
    await expect(obterConfiguracaoWhatsapp()).resolves.toMatchObject({ chave: "principal" });
    expect(prismaMock.configuracaoWhatsapp.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { chave: "principal" } }),
    );
  });

  it("ativa ou desativa sem alterar conexão e normaliza número opcional", async () => {
    await salvarConfiguracaoWhatsapp({
      ativo: false,
      numeroAviso: "(11) 98888-7777",
      mensagemPrimeiroContato: "Informe seu nome:\nAssunto:\nDescrição do problema:",
    });

    expect(prismaMock.configuracaoWhatsapp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ativo: false,
          numeroAviso: "11988887777",
          mensagemPrimeiroContato: "Informe seu nome:\nAssunto:\nDescrição do problema:",
        }),
      }),
    );
  });

  it("rejeita mensagem vazia ou sem campos mínimos", async () => {
    await expect(salvarConfiguracaoWhatsapp({ mensagemPrimeiroContato: "" })).resolves.toMatchObject({ sucesso: false });
    await expect(salvarConfiguracaoWhatsapp({ mensagemPrimeiroContato: "Informe seu nome" })).resolves.toMatchObject({
      sucesso: false,
    });
    expect(mensagemPrimeiroContatoValida("Nome\nAssunto\nDescricao")).toBe(true);
  });

  it("rejeita número opcional inválido", async () => {
    await expect(salvarConfiguracaoWhatsapp({ numeroAviso: "123" })).resolves.toMatchObject({ sucesso: false });
  });
});

describe("QR Code", () => {
  it("permite primeira solicitação e persiste bloqueio de 60 segundos", async () => {
    await expect(registrarSolicitacaoQrWhatsapp(agora)).resolves.toMatchObject({
      sucesso: true,
      dados: {
        qrExpiraEm: new Date("2026-06-14T12:00:30.000Z"),
        novaTentativaQrEm: new Date("2026-06-14T12:01:00.000Z"),
      },
    });
    expect(prismaMock.configuracaoWhatsapp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ultimaSolicitacaoQrEm: agora,
          novaTentativaQrEm: new Date("2026-06-14T12:01:00.000Z"),
        }),
      }),
    );
  });

  it("bloqueia nova solicitação antes de 60 segundos", async () => {
    prismaMock.configuracaoWhatsapp.upsert.mockResolvedValueOnce(
      configuracao({ novaTentativaQrEm: new Date("2026-06-14T12:00:45.000Z") }),
    );

    await expect(registrarSolicitacaoQrWhatsapp(agora)).resolves.toMatchObject({
      sucesso: false,
      bloqueado: true,
    });
  });
});

describe("fluxo automático por WhatsApp", () => {
  it("primeiro contato envia orientação e não cria chamado", async () => {
    await expect(processarWebhookWhatsapp(payloadMensagem("Oi, preciso de ajuda"), agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "orientacao_enviada" },
    });
    expect(chamadoMock.criarChamadoComDistribuicao).not.toHaveBeenCalled();
    expect(evolutionMock.enviarMensagemEvolution).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "ORIENTACAO_INICIAL" }),
    );
  });

  it("segunda mensagem válida cria chamado e agenda protocolo", async () => {
    prismaMock.sessaoWhatsapp.findFirst.mockResolvedValueOnce(sessao());

    await expect(
      processarWebhookWhatsapp(
        payloadMensagem("Nome: João da Silva\nAssunto: Computador não liga\nDescrição: Parou após queda de energia"),
        agora,
      ),
    ).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "chamado_criado", protocolo: "CHA-20260614-A1B2C3" },
    });
    expect(chamadoMock.criarChamadoComDistribuicao).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: "WHATSAPP",
        atribuicaoAutomatica: true,
        solicitanteNome: "João da Silva",
        solicitanteTelefone: "5511999999999",
      }),
    );
    expect(prismaMock.sessaoWhatsapp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "CHAMADO_CRIADO",
          protocoloAgendadoPara: new Date("2026-06-14T12:02:00.000Z"),
        }),
      }),
    );
  });

  it("segunda mensagem inválida repete orientação sem criar chamado", async () => {
    prismaMock.sessaoWhatsapp.findFirst.mockResolvedValueOnce(sessao());

    await expect(processarWebhookWhatsapp(payloadMensagem("texto livre"), agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "correcao_enviada" },
    });
    expect(chamadoMock.criarChamadoComDistribuicao).not.toHaveBeenCalled();
    expect(evolutionMock.enviarMensagemEvolution).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "SOLICITACAO_CORRECAO" }),
    );
  });

  it("webhook duplicado não duplica chamado", async () => {
    prismaMock.conversa.findUnique.mockResolvedValueOnce({ id: "conversa" });

    await expect(processarWebhookWhatsapp(payloadMensagem("Nome: João\nAssunto: X\nDescrição: Y"), agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "duplicado" },
    });
    expect(chamadoMock.criarChamadoComDistribuicao).not.toHaveBeenCalled();
  });

  it("resposta humana amplia sessão para trinta minutos e mensagem automática é ignorada", async () => {
    prismaMock.sessaoWhatsapp.findFirst.mockResolvedValueOnce(sessao({ estado: "CHAMADO_CRIADO", chamadoId: "chamado" }));

    await expect(processarWebhookWhatsapp(payloadMensagem("Já estamos verificando.", "humana-1", true), agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "resposta_humana" },
    });
    expect(prismaMock.sessaoWhatsapp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "EM_ATENDIMENTO",
          expiraEm: new Date("2026-06-14T12:30:00.000Z"),
        }),
      }),
    );

    vi.clearAllMocks();
    prismaMock.envioAutomaticoWhatsapp.findFirst.mockResolvedValueOnce({ id: "envio" });
    await expect(processarWebhookWhatsapp(payloadMensagem("Seu chamado foi criado.", "auto-1", true), agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { acao: "ignorado" },
    });
  });
});

describe("cron WhatsApp", () => {
  it("envia protocolo vencido uma única vez e marca sessão", async () => {
    prismaMock.sessaoWhatsapp.findMany.mockResolvedValueOnce([
      {
        id: "sessao",
        telefoneCliente: "5511999999999",
        chamado: {
          id: "chamado",
          protocolo: "CHA-20260614-A1B2C3",
          assunto: "Computador não liga",
          setor: { nome: "Tecnologia da Informação" },
        },
      },
    ]);

    await expect(processarAgendamentosWhatsapp(agora)).resolves.toMatchObject({
      sucesso: true,
      dados: { processados: 1, enviados: 1, falhas: 0 },
    });
    expect(evolutionMock.enviarMensagemEvolution).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "PROTOCOLO", chamadoId: "chamado" }),
    );
    expect(prismaMock.sessaoWhatsapp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          protocoloEnviadoEm: agora,
          expiraEm: new Date("2026-06-14T12:10:00.000Z"),
        }),
      }),
    );
  });
});
