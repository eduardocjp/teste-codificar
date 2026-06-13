import { prisma } from "../../lib/prisma";

/**
 * Lista setores ativos ordenados por nome.
 */
export async function listarSetoresAtivos() {
  return prisma.setor.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
}

/**
 * Busca o setor de triagem sem depender de ID fixo.
 */
export async function buscarSetorTriagem() {
  return prisma.setor.findFirst({
    where: { ativo: true, ehTriagem: true },
  });
}

/**
 * Confirma se um setor existe e está ativo.
 */
export async function buscarSetorAtivoPorId(id: string) {
  return prisma.setor.findFirst({
    where: { id, ativo: true },
  });
}
