import { beforeEach, describe, expect, it, vi } from "vitest";

const intencaoRepoMock = vi.hoisted(() => ({
  listarIntencoes: vi.fn(),
  listarIntencoesAtivas: vi.fn(),
  criarIntencao: vi.fn(),
  atualizarIntencao: vi.fn(),
}));

const setorServicoMock = vi.hoisted(() => ({
  obterSetorTriagemObrigatorio: vi.fn(),
}));

const chamadoRepoMock = vi.hoisted(() => ({
  listarChamados: vi.fn(),
  buscarChamadoPorId: vi.fn(),
  criarChamado: vi.fn(),
  atualizarChamado: vi.fn(),
}));

const setorRepoMock = vi.hoisted(() => ({
  buscarSetorAtivoPorId: vi.fn(),
}));

const responsavelServicoMock = vi.hoisted(() => ({
  validarResponsavelParaSetor: vi.fn(),
}));

const distribuicaoMock = vi.hoisted(() => ({
  atribuirChamadoAutomaticamente: vi.fn(),
  registrarUltimaAtribuicaoResponsavel: vi.fn(),
  selecionarResponsavelAutomaticamente: vi.fn(),
}));

vi.mock("../web/modules/intents/repositorio_intencao", () => intencaoRepoMock);
vi.mock("../web/modules/setores/servico_setor", () => setorServicoMock);
vi.mock("../web/modules/tickets/repositorio_chamado", () => chamadoRepoMock);
vi.mock("../web/modules/setores/repositorio_setor", () => setorRepoMock);
vi.mock("../web/modules/responsaveis/servico_responsavel", () => responsavelServicoMock);
vi.mock("../web/services/servico_distribuicao", () => distribuicaoMock);

import {
  analisarMensagemIntentSolver,
  obterIntencoes,
  salvarAtualizacaoIntencao,
  salvarNovaIntencao,
} from "../web/modules/intents/servico_intencao";
import {
  criarChamadoComDistribuicao,
  obterChamados,
  salvarAtualizacaoChamado,
} from "../web/modules/tickets/servico_chamado";
import type { SessaoUsuario } from "../web/types/usuario";

const uuidSetor = "11111111-1111-4111-8111-111111111111";
const uuidIntencao = "22222222-2222-4222-8222-222222222222";
const uuidResponsavel = "33333333-3333-4333-8333-333333333333";

const sessaoAdmin: SessaoUsuario = {
  id: "admin",
  nome: "Admin",
  email: "admin@empresa.com",
  perfil: "ADMINISTRADOR",
  setorId: null,
  setorNome: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("servico_intencao", () => {
  it("analisarMensagemIntentSolver rejeita mensagem inválida", async () => {
    await expect(analisarMensagemIntentSolver("abc")).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Mensagem inválida.",
    });
  });

  it("analisarMensagemIntentSolver usa intenções ativas e setor de triagem", async () => {
    intencaoRepoMock.listarIntencoesAtivas.mockResolvedValueOnce([
      {
        id: uuidIntencao,
        nome: "Problema com computador",
        slug: "problema-computador",
        descricao: null,
        assuntoSugerido: "Computador com defeito",
        palavrasChave: ["computador"],
        exemplos: [],
        prioridadeSugerida: "ALTA",
        confiancaMinima: 0.4,
        ativo: true,
        setor: { id: uuidSetor, nome: "TI", descricao: null, ehTriagem: false },
      },
    ]);
    setorServicoMock.obterSetorTriagemObrigatorio.mockResolvedValueOnce({
      id: "44444444-4444-4444-8444-444444444444",
      nome: "Triagem",
      descricao: null,
      ehTriagem: true,
    });

    await expect(analisarMensagemIntentSolver("computador travou")).resolves.toMatchObject({
      sucesso: true,
      dados: expect.objectContaining({ identificada: true, intencaoId: uuidIntencao }),
    });
  });

  it("obterIntencoes delega ao repositório", async () => {
    intencaoRepoMock.listarIntencoes.mockResolvedValueOnce([{ id: uuidIntencao }]);

    await expect(obterIntencoes(true)).resolves.toEqual([{ id: uuidIntencao }]);
    expect(intencaoRepoMock.listarIntencoes).toHaveBeenCalledWith(true);
  });

  it("salvarNovaIntencao rejeita dados inválidos", async () => {
    await expect(salvarNovaIntencao({})).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Dados inválidos.",
    });
  });

  it("salvarNovaIntencao cria intenção válida", async () => {
    intencaoRepoMock.criarIntencao.mockResolvedValueOnce({ id: uuidIntencao });

    await expect(
      salvarNovaIntencao({
        nome: "Problema com rede",
        slug: "problema-rede",
        assuntoSugerido: "Sem internet",
        palavrasChave: ["internet"],
        exemplos: [],
        setorId: uuidSetor,
      }),
    ).resolves.toEqual({ sucesso: true, dados: { id: uuidIntencao } });
  });

  it("salvarAtualizacaoIntencao atualiza dados parciais válidos", async () => {
    intencaoRepoMock.atualizarIntencao.mockResolvedValueOnce({ id: uuidIntencao });

    await expect(salvarAtualizacaoIntencao(uuidIntencao, { ativo: false })).resolves.toEqual({
      sucesso: true,
      dados: { id: uuidIntencao },
    });
  });
});

describe("servico_chamado", () => {
  it("obterChamados aplica filtros da URL", async () => {
    chamadoRepoMock.listarChamados.mockResolvedValueOnce({ chamados: [], total: 0 });

    await expect(obterChamados(new URLSearchParams("status=ABERTO"), sessaoAdmin)).resolves.toEqual({
      chamados: [],
      total: 0,
    });
    expect(chamadoRepoMock.listarChamados).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ABERTO", pagina: 1 }),
      sessaoAdmin,
    );
  });

  it("criarChamadoComDistribuicao rejeita payload inválido", async () => {
    await expect(criarChamadoComDistribuicao({ titulo: "Erro" })).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Não foi possível criar o chamado.",
    });
  });

  it("criarChamadoComDistribuicao rejeita setor inválido", async () => {
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce(null);

    await expect(
      criarChamadoComDistribuicao({
        titulo: "Notebook não liga",
        descricao: "Notebook do financeiro não liga desde cedo.",
        prioridade: "ALTA",
        status: "ABERTO",
        setorId: uuidSetor,
        origem: "MANUAL",
        atribuicaoAutomatica: true,
      }),
    ).resolves.toMatchObject({ sucesso: false, mensagem: "Setor inválido." });
  });

  it("criarChamadoComDistribuicao cria com responsável manual válido", async () => {
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    responsavelServicoMock.validarResponsavelParaSetor.mockResolvedValueOnce({
      sucesso: true,
      dados: { id: uuidResponsavel, nome: "Ana" },
    });
    chamadoRepoMock.criarChamado.mockResolvedValueOnce({ id: "chamado", setorId: uuidSetor });

    await expect(
      criarChamadoComDistribuicao({
        titulo: "Notebook não liga",
        descricao: "Notebook do financeiro não liga desde cedo.",
        prioridade: "ALTA",
        status: "ABERTO",
        setorId: uuidSetor,
        responsavelId: uuidResponsavel,
        origem: "MANUAL",
        atribuicaoAutomatica: false,
      }),
    ).resolves.toEqual({ sucesso: true, dados: { id: "chamado", setorId: uuidSetor } });
  });

  it("criarChamadoComDistribuicao chama atribuição automática quando solicitado", async () => {
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    distribuicaoMock.selecionarResponsavelAutomaticamente.mockResolvedValueOnce({ id: uuidResponsavel });
    chamadoRepoMock.criarChamado.mockResolvedValueOnce({ id: "chamado", responsavelId: uuidResponsavel });

    await expect(
      criarChamadoComDistribuicao({
        titulo: "Notebook não liga",
        descricao: "Notebook do financeiro não liga desde cedo.",
        prioridade: "ALTA",
        status: "ABERTO",
        setorId: uuidSetor,
        origem: "MANUAL",
        atribuicaoAutomatica: true,
      }),
    ).resolves.toEqual({ sucesso: true, dados: { id: "chamado", responsavelId: uuidResponsavel } });

    expect(distribuicaoMock.selecionarResponsavelAutomaticamente).toHaveBeenCalledWith(uuidSetor);
    expect(distribuicaoMock.registrarUltimaAtribuicaoResponsavel).toHaveBeenCalledWith(uuidResponsavel);
  });

  it("criarChamadoComDistribuicao salva sem responsavel quando nao ha atendente na atribuicao automatica", async () => {
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    distribuicaoMock.selecionarResponsavelAutomaticamente.mockResolvedValueOnce(null);
    chamadoRepoMock.criarChamado.mockResolvedValueOnce({ id: "chamado", responsavelId: null });

    await expect(
      criarChamadoComDistribuicao({
        titulo: "Notebook nao liga",
        descricao: "Notebook do financeiro nao liga desde cedo.",
        prioridade: "ALTA",
        status: "ABERTO",
        setorId: uuidSetor,
        origem: "MANUAL",
        atribuicaoAutomatica: true,
      }),
    ).resolves.toEqual({ sucesso: true, dados: { id: "chamado", responsavelId: null } });

    expect(chamadoRepoMock.criarChamado).toHaveBeenCalledWith(
      expect.objectContaining({ responsavelId: undefined, atribuicaoAutomatica: true }),
    );
    expect(distribuicaoMock.registrarUltimaAtribuicaoResponsavel).not.toHaveBeenCalled();
  });

  it("salvarAtualizacaoChamado retorna não encontrado", async () => {
    chamadoRepoMock.buscarChamadoPorId.mockResolvedValueOnce(null);

    await expect(salvarAtualizacaoChamado("chamado", { status: "FECHADO" }, sessaoAdmin)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Chamado não encontrado.",
    });
  });

  it("salvarAtualizacaoChamado preenche data de resolução", async () => {
    chamadoRepoMock.buscarChamadoPorId.mockResolvedValueOnce({ id: "chamado", setorId: uuidSetor });
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    chamadoRepoMock.atualizarChamado.mockResolvedValueOnce({ id: "chamado", status: "RESOLVIDO" });

    await expect(salvarAtualizacaoChamado("chamado", { status: "RESOLVIDO" }, sessaoAdmin)).resolves.toEqual({
      sucesso: true,
      dados: { id: "chamado", status: "RESOLVIDO" },
    });
    expect(chamadoRepoMock.atualizarChamado).toHaveBeenCalledWith(
      "chamado",
      expect.objectContaining({ status: "RESOLVIDO", dataResolucao: expect.any(Date), dataFechamento: null }),
    );
  });

  it("salvarAtualizacaoChamado limpa datas quando status volta para aberto", async () => {
    chamadoRepoMock.buscarChamadoPorId.mockResolvedValueOnce({ id: "chamado", setorId: uuidSetor });
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    chamadoRepoMock.atualizarChamado.mockResolvedValueOnce({ id: "chamado", status: "ABERTO" });

    await salvarAtualizacaoChamado("chamado", { status: "ABERTO" }, sessaoAdmin);

    expect(chamadoRepoMock.atualizarChamado).toHaveBeenCalledWith(
      "chamado",
      expect.objectContaining({ dataResolucao: null, dataFechamento: null }),
    );
  });
});
