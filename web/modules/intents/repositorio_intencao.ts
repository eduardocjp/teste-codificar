import { prisma } from "../../lib/prisma";
import type { DadosAtualizacaoIntencao, DadosCriacaoIntencao } from "./schema_intencao";

/**
 * Lista intenções com setor para telas administrativas e solver.
 */
export async function listarIntencoes(ativo?: boolean) {
  return prisma.intencao.findMany({
    where: { ativo },
    include: { setor: true },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

/**
 * Lista apenas intenções ativas para classificação.
 */
export async function listarIntencoesAtivas() {
  return listarIntencoes(true);
}

/**
 * Cria uma intenção configurável do Intent Solver.
 */
export async function criarIntencao(dados: DadosCriacaoIntencao) {
  return prisma.intencao.create({
    data: dados,
    include: { setor: true },
  });
}

/**
 * Atualiza configuração de intenção.
 */
export async function atualizarIntencao(id: string, dados: DadosAtualizacaoIntencao) {
  return prisma.intencao.update({
    where: { id },
    data: dados,
    include: { setor: true },
  });
}

/**
 * Remove uma intenção da operação sem apagar histórico.
 */
export async function desativarIntencao(id: string) {
  return prisma.intencao.update({
    where: { id },
    data: { ativo: false },
    include: { setor: true },
  });
}
