import { beforeEach, describe, expect, it, vi } from "vitest";

const setorRepoMock = vi.hoisted(() => ({
  listarSetoresAtivos: vi.fn(),
  buscarSetorTriagem: vi.fn(),
  buscarSetorAtivoPorId: vi.fn(),
}));

const responsavelRepoMock = vi.hoisted(() => ({
  listarResponsaveisAtivos: vi.fn(),
  buscarResponsavelPorId: vi.fn(),
}));

const segurancaMock = vi.hoisted(() => ({
  gerarHashSenha: vi.fn(async () => "hash-gerado"),
}));

const prismaMock = vi.hoisted(() => ({
  usuario: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  chamado: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (operacoes: Promise<unknown>[] | ((cliente: unknown) => Promise<unknown>)) => {
    if (typeof operacoes === "function") {
      return operacoes(prismaMock);
    }

    return Promise.all(operacoes);
  }),
}));

vi.mock("../web/modules/setores/repositorio_setor", () => setorRepoMock);
vi.mock("../web/modules/responsaveis/repositorio_responsavel", () => responsavelRepoMock);
vi.mock("../web/lib/seguranca", () => segurancaMock);
vi.mock("../web/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { obterSetorTriagemObrigatorio, obterSetoresParaSelecao } from "../web/modules/setores/servico_setor";
import {
  criarResponsavel,
  listarResponsaveis,
  validarResponsavelParaSetor,
} from "../web/modules/responsaveis/servico_responsavel";
import {
  atribuirChamadoAutomaticamente,
  selecionarResponsavelAutomaticamente,
} from "../web/services/servico_distribuicao";
import { obterDadosDashboard } from "../web/services/servico_dashboard";
import type { SessaoUsuario } from "../web/types/usuario";

const uuidSetor = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("servico_setor", () => {
  it("obterSetoresParaSelecao usa repositório de setores ativos", async () => {
    setorRepoMock.listarSetoresAtivos.mockResolvedValueOnce([{ id: "setor" }]);

    await expect(obterSetoresParaSelecao()).resolves.toEqual([{ id: "setor" }]);
  });

  it("obterSetorTriagemObrigatorio retorna setor de triagem", async () => {
    setorRepoMock.buscarSetorTriagem.mockResolvedValueOnce({ id: "triagem" });

    await expect(obterSetorTriagemObrigatorio()).resolves.toEqual({ id: "triagem" });
  });

  it("obterSetorTriagemObrigatorio lança erro quando não configurado", async () => {
    setorRepoMock.buscarSetorTriagem.mockResolvedValueOnce(null);

    await expect(obterSetorTriagemObrigatorio()).rejects.toThrow("Setor de triagem não configurado.");
  });
});

describe("servico_responsavel", () => {
  it("listarResponsaveis delega ao repositório", async () => {
    responsavelRepoMock.listarResponsaveisAtivos.mockResolvedValueOnce([{ id: "ana" }]);

    await expect(listarResponsaveis("setor")).resolves.toEqual([{ id: "ana" }]);
    expect(responsavelRepoMock.listarResponsaveisAtivos).toHaveBeenCalledWith("setor");
  });

  it("validarResponsavelParaSetor rejeita responsável ausente", async () => {
    responsavelRepoMock.buscarResponsavelPorId.mockResolvedValueOnce(null);

    await expect(validarResponsavelParaSetor("resp", uuidSetor)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Responsável não encontrado.",
    });
  });

  it("validarResponsavelParaSetor rejeita inativo ou sem perfil", async () => {
    responsavelRepoMock.buscarResponsavelPorId.mockResolvedValueOnce({
      id: "resp",
      ativo: false,
      perfil: "ATENDENTE",
      setorId: uuidSetor,
    });

    await expect(validarResponsavelParaSetor("resp", uuidSetor)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Responsável inativo ou sem perfil de atendente.",
    });
  });

  it("validarResponsavelParaSetor rejeita setor diferente", async () => {
    responsavelRepoMock.buscarResponsavelPorId.mockResolvedValueOnce({
      id: "resp",
      nome: "Ana",
      ativo: true,
      perfil: "ATENDENTE",
      setorId: "outro-setor",
    });

    await expect(validarResponsavelParaSetor("resp", uuidSetor)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Responsável não pertence ao setor selecionado.",
    });
  });

  it("validarResponsavelParaSetor aceita atendente ativo do setor", async () => {
    responsavelRepoMock.buscarResponsavelPorId.mockResolvedValueOnce({
      id: "resp",
      nome: "Ana",
      ativo: true,
      perfil: "ATENDENTE",
      setorId: uuidSetor,
    });

    await expect(validarResponsavelParaSetor("resp", uuidSetor)).resolves.toEqual({
      sucesso: true,
      dados: { id: "resp", nome: "Ana" },
    });
  });

  it("criarResponsavel rejeita atendente sem setor", async () => {
    await expect(
      criarResponsavel({
        nome: "Ana Lima",
        email: "ana@empresa.com",
        senha: "senha123",
        perfil: "ATENDENTE",
      }),
    ).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Atendente precisa estar associado a um setor.",
    });
  });

  it("criarResponsavel cria usuário com senha hasheada", async () => {
    setorRepoMock.buscarSetorAtivoPorId.mockResolvedValueOnce({ id: uuidSetor });
    prismaMock.usuario.create.mockResolvedValueOnce({ id: "novo" });

    await expect(
      criarResponsavel({
        nome: "Ana Lima",
        email: "ana@empresa.com",
        senha: "senha123",
        perfil: "ATENDENTE",
        setorId: uuidSetor,
        ativo: true,
      }),
    ).resolves.toEqual({ sucesso: true, dados: { id: "novo" } });

    expect(segurancaMock.gerarHashSenha).toHaveBeenCalledWith("senha123");
    expect(prismaMock.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ senhaHash: "hash-gerado", setorId: uuidSetor }),
      }),
    );
  });
});

describe("servico_distribuicao com Prisma", () => {
  it("selecionarResponsavelAutomaticamente retorna menor carga", async () => {
    prismaMock.usuario.findMany.mockResolvedValueOnce([
      { id: "b", ultimaAtribuicao: null, _count: { chamadosResponsaveis: 2 } },
      { id: "a", ultimaAtribuicao: null, _count: { chamadosResponsaveis: 1 } },
    ]);

    await expect(selecionarResponsavelAutomaticamente(uuidSetor)).resolves.toMatchObject({ id: "a" });
  });

  it("atribuirChamadoAutomaticamente retorna null sem responsável", async () => {
    prismaMock.usuario.findMany.mockResolvedValueOnce([]);

    await expect(atribuirChamadoAutomaticamente("chamado", uuidSetor)).resolves.toBeNull();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("atribuirChamadoAutomaticamente atualiza chamado e última atribuição", async () => {
    prismaMock.usuario.findMany.mockResolvedValueOnce([
      { id: "resp", ultimaAtribuicao: null, _count: { chamadosResponsaveis: 0 } },
    ]);
    prismaMock.chamado.update.mockResolvedValueOnce({ id: "chamado" });
    prismaMock.usuario.update.mockResolvedValueOnce({ id: "resp" });

    await expect(atribuirChamadoAutomaticamente("chamado", uuidSetor)).resolves.toMatchObject({ id: "resp" });
    expect(prismaMock.chamado.update).toHaveBeenCalledWith({
      where: { id: "chamado" },
      data: { responsavelId: "resp" },
    });
    expect(prismaMock.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "resp" } }),
    );
  });
});

describe("servico_dashboard", () => {
  it("obterDadosDashboard aplica filtro de atendente quando perfil é ATENDENTE", async () => {
    prismaMock.chamado.groupBy.mockResolvedValueOnce([]);
    prismaMock.chamado.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    prismaMock.chamado.findMany.mockResolvedValueOnce([]);
    prismaMock.usuario.findMany.mockResolvedValueOnce([]);

    const sessao: SessaoUsuario = {
      id: "atendente",
      nome: "Ana",
      email: "ana@empresa.com",
      perfil: "ATENDENTE",
      setorId: uuidSetor,
      setorNome: "TI",
    };

    await expect(obterDadosDashboard(sessao)).resolves.toMatchObject({
      altaPrioridade: 1,
      semResponsavel: 2,
    });
    expect(prismaMock.chamado.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { responsavelId: "atendente" } }),
    );
  });
});
