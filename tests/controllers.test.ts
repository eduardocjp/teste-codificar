import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { NextRequest } from "next/server";

const authMock = vi.hoisted(() => ({
  autenticarUsuario: vi.fn(),
  encerrarSessaoAtual: vi.fn(),
  obterConfiguracaoCookieSessao: vi.fn(() => ({
    name: "sessao_chamados",
    options: { path: "/", httpOnly: true, sameSite: "lax" as const },
  })),
  validarSessaoAtiva: vi.fn(),
}));

const setorMock = vi.hoisted(() => ({
  obterSetoresParaSelecao: vi.fn(),
}));

const responsavelMock = vi.hoisted(() => ({
  listarResponsaveis: vi.fn(),
  criarResponsavel: vi.fn(),
  atualizarResponsavel: vi.fn(),
  excluirResponsavel: vi.fn(),
}));

const intentSolverMock = vi.hoisted(() => ({
  analisarMensagemIntentSolver: vi.fn(),
  obterIntencoes: vi.fn(),
  salvarNovaIntencao: vi.fn(),
  salvarAtualizacaoIntencao: vi.fn(),
}));

const intencaoRepoMock = vi.hoisted(() => ({
  desativarIntencao: vi.fn(),
  excluirIntencao: vi.fn(),
}));

const chamadoServicoMock = vi.hoisted(() => ({
  obterChamados: vi.fn(),
  criarChamadoComDistribuicao: vi.fn(),
  salvarAtualizacaoChamado: vi.fn(),
}));

const chamadoRepoMock = vi.hoisted(() => ({
  buscarChamadoPorId: vi.fn(),
}));

const distribuicaoMock = vi.hoisted(() => ({
  atribuirChamadoAutomaticamente: vi.fn(),
}));

const envMock = vi.hoisted(() => ({
  obterEnv: vi.fn(() => ({ EVOLUTION_API_HABILITADA: "false" })),
}));

vi.mock("../web/lib/auth", () => authMock);
vi.mock("../web/modules/setores/servico_setor", () => setorMock);
vi.mock("../web/modules/responsaveis/servico_responsavel", () => responsavelMock);
vi.mock("../web/modules/intents/servico_intencao", () => intentSolverMock);
vi.mock("../web/modules/intents/repositorio_intencao", () => intencaoRepoMock);
vi.mock("../web/modules/tickets/servico_chamado", () => chamadoServicoMock);
vi.mock("../web/modules/tickets/repositorio_chamado", () => chamadoRepoMock);
vi.mock("../web/services/servico_distribuicao", () => distribuicaoMock);
vi.mock("../web/lib/env", () => envMock);
vi.mock("../web/utils/logger", () => ({
  logError: vi.fn(),
}));

import { controllerLogin, controllerLogout } from "../web/controllers/controller_auth";
import {
  controllerAtualizarChamado,
  controllerBuscarChamado,
  controllerCriarChamado,
  controllerDistribuicao,
  controllerListarChamados,
} from "../web/controllers/controller_chamado";
import {
  controllerAtualizarIntencao,
  controllerCriarIntencao,
  controllerExcluirIntencao,
  controllerListarIntencoes,
} from "../web/controllers/controller_intencao";
import { controllerIntentSolver } from "../web/controllers/controller_intent_solver";
import {
  controllerAtualizarResponsavel,
  controllerCriarResponsavel,
  controllerExcluirResponsavel,
  controllerListarResponsaveis,
} from "../web/controllers/controller_responsavel";
import { controllerListarSetores } from "../web/controllers/controller_setor";
import { controllerWebhookEvolution } from "../web/controllers/controller_webhook_evolution";

const sessaoOk = {
  sucesso: true as const,
  dados: {
    id: "admin",
    nome: "Admin",
    email: "admin@empresa.com",
    perfil: "ADMINISTRADOR" as const,
    setorId: null,
    setorNome: null,
  },
};

function requestJson(body: unknown, url = "http://localhost/api"): NextRequest {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as NextRequest;
}

function requestGet(url = "http://localhost/api"): NextRequest {
  const request = new Request(url) as NextRequest;
  Object.defineProperty(request, "nextUrl", {
    value: new URL(url),
  });
  return request;
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.validarSessaoAtiva.mockResolvedValue(sessaoOk);
});

describe("controller_auth", () => {
  it("controllerLogin rejeita payload inválido", async () => {
    const response = await controllerLogin(requestJson({ email: "invalido" }));

    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toMatchObject({ sucesso: false });
  });

  it("controllerLogin retorna 401 para credenciais inválidas", async () => {
    authMock.autenticarUsuario.mockResolvedValueOnce({ sucesso: false, mensagem: "Credenciais inválidas." });

    const response = await controllerLogin(requestJson({ email: "admin@empresa.com", senha: "errada" }));

    expect(response.status).toBe(401);
  });

  it("controllerLogin cria cookie em autenticação válida", async () => {
    authMock.autenticarUsuario.mockResolvedValueOnce({
      sucesso: true,
      dados: {
        usuario: sessaoOk.dados,
        sessao: { token: "token-bruto", expiraEm: new Date("2026-01-01T10:00:00Z") },
      },
    });

    const response = await controllerLogin(requestJson({ email: "admin@empresa.com", senha: "admin123" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("sessao_chamados=token-bruto");
  });

  it("controllerLogout encerra sessão e redireciona para login", async () => {
    const response = await controllerLogout(requestGet("http://localhost/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
    expect(authMock.encerrarSessaoAtual).toHaveBeenCalled();
  });
});

describe("controllers de consulta simples", () => {
  it("controllerListarSetores exige sessão", async () => {
    authMock.validarSessaoAtiva.mockResolvedValueOnce({ sucesso: false, mensagem: "Sessão inválida." });

    const response = await controllerListarSetores();

    expect(response.status).toBe(401);
  });

  it("controllerListarSetores retorna setores", async () => {
    setorMock.obterSetoresParaSelecao.mockResolvedValueOnce([{ id: "setor" }]);

    const response = await controllerListarSetores();

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({ sucesso: true, dados: [{ id: "setor" }] });
  });

  it("controllerListarResponsaveis usa query setorId", async () => {
    responsavelMock.listarResponsaveis.mockResolvedValueOnce([]);

    const response = await controllerListarResponsaveis(requestGet("http://localhost/api/responsaveis?setorId=ti"));

    expect(response.status).toBe(200);
    expect(responsavelMock.listarResponsaveis).toHaveBeenCalledWith("ti");
  });

  it("controllerCriarResponsavel exige administrador", async () => {
    responsavelMock.criarResponsavel.mockResolvedValueOnce({ sucesso: true, dados: { id: "resp" } });

    const response = await controllerCriarResponsavel(requestJson({ nome: "Ana" }));

    expect(response.status).toBe(201);
    expect(authMock.validarSessaoAtiva).toHaveBeenCalledWith(["ADMINISTRADOR"]);
  });

  it("controllerAtualizarResponsavel atualiza atendente", async () => {
    responsavelMock.atualizarResponsavel.mockResolvedValueOnce({ sucesso: true, dados: { id: "resp" } });

    const response = await controllerAtualizarResponsavel(requestJson({ ativo: false }), "resp");

    expect(response.status).toBe(200);
    expect(responsavelMock.atualizarResponsavel).toHaveBeenCalledWith("resp", { ativo: false });
  });

  it("controllerExcluirResponsavel exclui atendente", async () => {
    responsavelMock.excluirResponsavel.mockResolvedValueOnce({ sucesso: true, dados: { id: "resp" } });

    const response = await controllerExcluirResponsavel("resp");

    expect(response.status).toBe(200);
    expect(responsavelMock.excluirResponsavel).toHaveBeenCalledWith("resp");
  });
});

describe("controllers de intenção e solver", () => {
  it("controllerIntentSolver retorna resultado do serviço", async () => {
    intentSolverMock.analisarMensagemIntentSolver.mockResolvedValueOnce({ sucesso: true, dados: { identificada: false } });

    const response = await controllerIntentSolver(requestJson({ mensagem: "pedido geral" }));

    expect(response.status).toBe(200);
    expect(intentSolverMock.analisarMensagemIntentSolver).toHaveBeenCalledWith("pedido geral");
  });

  it("controllerListarIntencoes interpreta ativo=true", async () => {
    intentSolverMock.obterIntencoes.mockResolvedValueOnce([]);

    const response = await controllerListarIntencoes(requestGet("http://localhost/api/intencoes?ativo=true"));

    expect(response.status).toBe(200);
    expect(intentSolverMock.obterIntencoes).toHaveBeenCalledWith(true);
  });

  it("controllerCriarIntencao retorna 201 em sucesso", async () => {
    intentSolverMock.salvarNovaIntencao.mockResolvedValueOnce({ sucesso: true, dados: { id: "intencao" } });

    const response = await controllerCriarIntencao(requestJson({ nome: "Rede" }));

    expect(response.status).toBe(201);
  });

  it("controllerAtualizarIntencao retorna 400 em falha de validação", async () => {
    intentSolverMock.salvarAtualizacaoIntencao.mockResolvedValueOnce({ sucesso: false, mensagem: "Dados inválidos." });

    const response = await controllerAtualizarIntencao(requestJson({ slug: "Inválido" }), "intencao");

    expect(response.status).toBe(400);
  });

  it("controllerExcluirIntencao retorna id excluído", async () => {
    intencaoRepoMock.excluirIntencao.mockResolvedValueOnce({ id: "intencao" });

    const response = await controllerExcluirIntencao("intencao");

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({ sucesso: true, dados: { id: "intencao" } });
  });
});

describe("controllers de chamados", () => {
  it("controllerListarChamados retorna dados paginados", async () => {
    chamadoServicoMock.obterChamados.mockResolvedValueOnce({ chamados: [], total: 0 });

    const response = await controllerListarChamados(requestGet("http://localhost/api/chamados"));

    expect(response.status).toBe(200);
    expect(chamadoServicoMock.obterChamados).toHaveBeenCalled();
  });

  it("controllerCriarChamado retorna 201 em sucesso", async () => {
    chamadoServicoMock.criarChamadoComDistribuicao.mockResolvedValueOnce({ sucesso: true, dados: { id: "chamado" } });

    const response = await controllerCriarChamado(requestJson({ titulo: "Chamado" }));

    expect(response.status).toBe(201);
  });

  it("controllerBuscarChamado retorna 404 quando não encontra", async () => {
    chamadoRepoMock.buscarChamadoPorId.mockResolvedValueOnce(null);

    const response = await controllerBuscarChamado("chamado");

    expect(response.status).toBe(404);
  });

  it("controllerBuscarChamado retorna chamado encontrado", async () => {
    chamadoRepoMock.buscarChamadoPorId.mockResolvedValueOnce({ id: "chamado" });

    const response = await controllerBuscarChamado("chamado");

    expect(response.status).toBe(200);
  });

  it("controllerAtualizarChamado retorna 200 em sucesso", async () => {
    chamadoServicoMock.salvarAtualizacaoChamado.mockResolvedValueOnce({ sucesso: true, dados: { id: "chamado" } });

    const response = await controllerAtualizarChamado(requestJson({ status: "FECHADO" }), "chamado");

    expect(response.status).toBe(200);
  });

  it("controllerDistribuicao rejeita body inválido", async () => {
    const response = await controllerDistribuicao(requestJson({ chamadoId: "invalido" }));

    expect(response.status).toBe(400);
  });

  it("controllerDistribuicao retorna 404 sem atendente", async () => {
    distribuicaoMock.atribuirChamadoAutomaticamente.mockResolvedValueOnce(null);

    const response = await controllerDistribuicao(
      requestJson({
        chamadoId: "11111111-1111-4111-8111-111111111111",
        setorId: "22222222-2222-4222-8222-222222222222",
      }),
    );

    expect(response.status).toBe(404);
  });

  it("controllerDistribuicao retorna responsável atribuído", async () => {
    distribuicaoMock.atribuirChamadoAutomaticamente.mockResolvedValueOnce({ id: "resp" });

    const response = await controllerDistribuicao(
      requestJson({
        chamadoId: "11111111-1111-4111-8111-111111111111",
        setorId: "22222222-2222-4222-8222-222222222222",
      }),
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({ sucesso: true });
  });
});

describe("controllerWebhookEvolution", () => {
  it("retorna 404 quando Evolution está desabilitada", async () => {
    (envMock.obterEnv as Mock).mockReturnValueOnce({ EVOLUTION_API_HABILITADA: "false" });

    const response = await controllerWebhookEvolution();

    expect(response.status).toBe(404);
  });

  it("retorna 501 quando Evolution está habilitada mas não implementada", async () => {
    (envMock.obterEnv as Mock).mockReturnValueOnce({ EVOLUTION_API_HABILITADA: "true" });

    const response = await controllerWebhookEvolution();

    expect(response.status).toBe(501);
  });
});
