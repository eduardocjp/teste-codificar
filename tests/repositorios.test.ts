import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  setor: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  usuario: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  intencao: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  chamado: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (operacoes: Promise<unknown>[]) => Promise.all(operacoes)),
}));

vi.mock("../web/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  buscarSetorAtivoPorId,
  buscarSetorTriagem,
  listarSetoresAtivos,
} from "../web/modules/setores/repositorio_setor";
import {
  buscarResponsavelPorId,
  listarResponsaveisAtivos,
} from "../web/modules/responsaveis/repositorio_responsavel";
import {
  atualizarIntencao,
  criarIntencao,
  desativarIntencao,
  listarIntencoes,
  listarIntencoesAtivas,
} from "../web/modules/intents/repositorio_intencao";
import {
  atualizarChamado,
  buscarChamadoPorId,
  criarChamado,
  listarChamados,
} from "../web/modules/tickets/repositorio_chamado";
import type { SessaoUsuario } from "../web/types/usuario";

const sessaoAdmin: SessaoUsuario = {
  id: "admin-id",
  nome: "Admin",
  email: "admin@empresa.com",
  perfil: "ADMINISTRADOR",
  setorId: null,
  setorNome: null,
};

const sessaoAtendente: SessaoUsuario = {
  id: "atendente-id",
  nome: "Ana",
  email: "ana@empresa.com",
  perfil: "ATENDENTE",
  setorId: "setor-id",
  setorNome: "TI",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("repositorio_setor", () => {
  it("listarSetoresAtivos consulta setores ativos ordenados", async () => {
    prismaMock.setor.findMany.mockResolvedValueOnce([]);

    await expect(listarSetoresAtivos()).resolves.toEqual([]);
    expect(prismaMock.setor.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
  });

  it("buscarSetorTriagem consulta setor ativo de triagem", async () => {
    prismaMock.setor.findFirst.mockResolvedValueOnce({ id: "triagem" });

    await expect(buscarSetorTriagem()).resolves.toEqual({ id: "triagem" });
    expect(prismaMock.setor.findFirst).toHaveBeenCalledWith({
      where: { ativo: true, ehTriagem: true },
    });
  });

  it("buscarSetorAtivoPorId consulta por id e ativo", async () => {
    prismaMock.setor.findFirst.mockResolvedValueOnce({ id: "setor-id" });

    await expect(buscarSetorAtivoPorId("setor-id")).resolves.toEqual({ id: "setor-id" });
    expect(prismaMock.setor.findFirst).toHaveBeenCalledWith({
      where: { id: "setor-id", ativo: true },
    });
  });
});

describe("repositorio_responsavel", () => {
  it("listarResponsaveisAtivos filtra por setor quando informado", async () => {
    prismaMock.usuario.findMany.mockResolvedValueOnce([]);

    await listarResponsaveisAtivos("setor-id");

    expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { perfil: "ATENDENTE", ativo: true, setorId: "setor-id" },
      }),
    );
  });

  it("buscarResponsavelPorId consulta usuario com setor", async () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: "resp-id" });

    await expect(buscarResponsavelPorId("resp-id")).resolves.toEqual({ id: "resp-id" });
    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: "resp-id" },
      include: { setor: true },
    });
  });
});

describe("repositorio_intencao", () => {
  it("listarIntencoes repassa filtro ativo", async () => {
    prismaMock.intencao.findMany.mockResolvedValueOnce([]);

    await listarIntencoes(true);

    expect(prismaMock.intencao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ativo: true } }),
    );
  });

  it("listarIntencoesAtivas chama listagem ativa", async () => {
    prismaMock.intencao.findMany.mockResolvedValueOnce([{ id: "intencao" }]);

    await expect(listarIntencoesAtivas()).resolves.toEqual([{ id: "intencao" }]);
    expect(prismaMock.intencao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ativo: true } }),
    );
  });

  it("criarIntencao persiste dados validados", async () => {
    prismaMock.intencao.create.mockResolvedValueOnce({ id: "nova" });

    await criarIntencao({
      nome: "Rede",
      slug: "rede",
      assuntoSugerido: "Sem internet",
      palavrasChave: ["internet"],
      exemplos: [],
      prioridadeSugerida: "MEDIA",
      confiancaMinima: 0.5,
      ativo: true,
      setorId: "11111111-1111-4111-8111-111111111111",
    });

    expect(prismaMock.intencao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: "rede" }) }));
  });

  it("atualizarIntencao atualiza por id", async () => {
    prismaMock.intencao.update.mockResolvedValueOnce({ id: "intencao" });

    await atualizarIntencao("intencao", { ativo: false });

    expect(prismaMock.intencao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "intencao" }, data: { ativo: false } }),
    );
  });

  it("desativarIntencao define ativo false", async () => {
    prismaMock.intencao.update.mockResolvedValueOnce({ id: "intencao", ativo: false });

    await desativarIntencao("intencao");

    expect(prismaMock.intencao.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "intencao" }, data: { ativo: false } }),
    );
  });
});

describe("repositorio_chamado", () => {
  it("listarChamados aplica escopo global para administrador", async () => {
    prismaMock.chamado.findMany.mockResolvedValueOnce([{ id: "chamado" }]);
    prismaMock.chamado.count.mockResolvedValueOnce(1);

    await expect(
      listarChamados(
        {
          pagina: 1,
          limite: 20,
          ordenarPor: "recentes",
          busca: "notebook",
        },
        sessaoAdmin,
      ),
    ).resolves.toEqual({ chamados: [{ id: "chamado" }], total: 1 });

    expect(prismaMock.chamado.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
        skip: 0,
        take: 20,
      }),
    );
  });

  it("listarChamados restringe atendente ao próprio responsável", async () => {
    prismaMock.chamado.findMany.mockResolvedValueOnce([]);
    prismaMock.chamado.count.mockResolvedValueOnce(0);

    await listarChamados({ pagina: 2, limite: 10, ordenarPor: "antigos" }, sessaoAtendente);

    expect(prismaMock.chamado.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ responsavelId: "atendente-id" }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it("buscarChamadoPorId aplica escopo de atendente quando informado", async () => {
    prismaMock.chamado.findFirst.mockResolvedValueOnce({ id: "chamado" });

    await buscarChamadoPorId("chamado", sessaoAtendente);

    expect(prismaMock.chamado.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "chamado", responsavelId: "atendente-id" },
      }),
    );
  });

  it("criarChamado persiste payload normalizado", async () => {
    prismaMock.chamado.create.mockResolvedValueOnce({ id: "novo" });

    await criarChamado({
      titulo: "Notebook não liga",
      descricao: "Notebook sem ligar desde cedo.",
      prioridade: "ALTA",
      status: "ABERTO",
      setorId: "11111111-1111-4111-8111-111111111111",
      responsavelId: undefined,
      intencaoId: undefined,
      origem: "MANUAL",
      atribuicaoAutomatica: false,
    });

    expect(prismaMock.chamado.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ titulo: "Notebook não liga", origem: "MANUAL" }),
      }),
    );
  });

  it("atualizarChamado atualiza por id", async () => {
    prismaMock.chamado.update.mockResolvedValueOnce({ id: "chamado" });

    await atualizarChamado("chamado", { status: "FECHADO" });

    expect(prismaMock.chamado.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "chamado" }, data: { status: "FECHADO" } }),
    );
  });
});
