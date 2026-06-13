import type { Prisma } from "../../../src/generated/prisma/client";

import { prisma } from "../../lib/prisma";
import type { DadosCriacaoChamado, DadosFiltroChamado } from "./schema_chamado";
import type { SessaoUsuario } from "../../types/usuario";
import type { OrigemChamadoValor } from "../../types/dominio";

export type DadosAtualizacaoChamadoPersistencia = {
  titulo?: string;
  descricao?: string;
  assunto?: string | null;
  prioridade?: "BAIXA" | "MEDIA" | "ALTA";
  status?: "ABERTO" | "EM_ANDAMENTO" | "RESOLVIDO" | "FECHADO";
  origem?: OrigemChamadoValor;
  setorId?: string;
  responsavelId?: string | null;
  intencaoId?: string | null;
  confiancaIntencao?: number | null;
  dataResolucao?: Date | null;
  dataFechamento?: Date | null;
};

const includeChamado = {
  setor: { select: { id: true, nome: true } },
  responsavel: { select: { id: true, nome: true, email: true } },
  intencao: { select: { id: true, nome: true } },
} satisfies Prisma.ChamadoInclude;

function montarWhere(filtros: DadosFiltroChamado, sessao: SessaoUsuario): Prisma.ChamadoWhereInput {
  const where: Prisma.ChamadoWhereInput = {
    status: filtros.status,
    prioridade: filtros.prioridade,
    origem: filtros.origem,
    setorId: filtros.setorId,
    responsavelId: filtros.responsavelId,
  };

  if (sessao.perfil === "ATENDENTE") {
    where.responsavelId = sessao.id;
  }

  if (filtros.busca) {
    where.OR = [
      { titulo: { contains: filtros.busca, mode: "insensitive" } },
      { descricao: { contains: filtros.busca, mode: "insensitive" } },
      { assunto: { contains: filtros.busca, mode: "insensitive" } },
    ];
  }

  return where;
}

function montarOrdenacao(ordenarPor: DadosFiltroChamado["ordenarPor"]): Prisma.ChamadoOrderByWithRelationInput[] {
  if (ordenarPor === "antigos") {
    return [{ dataAbertura: "asc" }];
  }

  if (ordenarPor === "prioridade") {
    return [{ prioridade: "desc" }, { dataAbertura: "desc" }];
  }

  if (ordenarPor === "status") {
    return [{ status: "asc" }, { dataAbertura: "desc" }];
  }

  if (ordenarPor === "titulo") {
    return [{ titulo: "asc" }];
  }

  return [{ dataAbertura: "desc" }];
}

/**
 * Lista chamados com filtros e paginação.
 */
export async function listarChamados(filtros: DadosFiltroChamado, sessao: SessaoUsuario) {
  const where = montarWhere(filtros, sessao);
  const skip = (filtros.pagina - 1) * filtros.limite;

  const [chamados, total] = await prisma.$transaction([
    prisma.chamado.findMany({
      where,
      include: includeChamado,
      orderBy: montarOrdenacao(filtros.ordenarPor),
      skip,
      take: filtros.limite,
    }),
    prisma.chamado.count({ where }),
  ]);

  return { chamados, total };
}

/**
 * Busca um chamado por ID respeitando o escopo do atendente.
 */
export async function buscarChamadoPorId(id: string, sessao?: SessaoUsuario) {
  return prisma.chamado.findFirst({
    where: {
      id,
      responsavelId: sessao?.perfil === "ATENDENTE" ? sessao.id : undefined,
    },
    include: includeChamado,
  });
}

/**
 * Persiste um chamado novo.
 */
export async function criarChamado(dados: DadosCriacaoChamado) {
  return prisma.chamado.create({
    data: {
      titulo: dados.titulo,
      descricao: dados.descricao,
      prioridade: dados.prioridade,
      status: dados.status,
      setorId: dados.setorId,
      responsavelId: dados.responsavelId,
      intencaoId: dados.intencaoId,
      assunto: dados.assunto ?? null,
      confiancaIntencao: dados.confiancaIntencao ?? null,
      origem: dados.origem,
    },
    include: includeChamado,
  });
}

/**
 * Atualiza campos permitidos de um chamado.
 */
export async function atualizarChamado(id: string, dados: DadosAtualizacaoChamadoPersistencia) {
  return prisma.chamado.update({
    where: { id },
    data: dados,
    include: includeChamado,
  });
}
