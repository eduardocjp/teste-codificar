import { prisma } from "../../lib/prisma";
import { STATUS_CHAMADOS_ATIVOS } from "../../types/dominio";

/**
 * Lista atendentes ativos, opcionalmente filtrados por setor.
 */
export async function listarResponsaveisAtivos(setorId?: string) {
  return prisma.usuario.findMany({
    where: {
      perfil: "ATENDENTE",
      ativo: true,
      setorId: setorId ?? undefined,
    },
    include: {
      setor: true,
      _count: {
        select: {
          chamadosResponsaveis: {
            where: { status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
          },
        },
      },
    },
    orderBy: [{ nome: "asc" }],
  });
}

/**
 * Lista atendentes ativos e inativos para administração.
 */
export async function listarAtendentesAdministracao() {
  return prisma.usuario.findMany({
    where: {
      perfil: "ATENDENTE",
    },
    include: {
      setor: true,
      _count: {
        select: {
          chamadosResponsaveis: {
            where: { status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
          },
        },
      },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

/**
 * Busca um atendente por ID para validar atribuição manual.
 */
export async function buscarResponsavelPorId(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    include: { setor: true },
  });
}
