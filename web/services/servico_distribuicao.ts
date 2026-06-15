import { prisma } from "../lib/prisma";
import { STATUS_CHAMADOS_ATIVOS } from "../types/dominio";

export type CandidatoResponsavelDistribuicao = {
  id: string;
  ultimaAtribuicao: Date | null;
  cargaAtiva: number;
};

/**
 * Ordena candidatos pela regra de menor carga, última atribuição e menor ID.
 */
export function ordenarResponsaveisPorCarga<T extends CandidatoResponsavelDistribuicao>(candidatos: T[]): T[] {
  return [...candidatos].sort((a, b) => {
    if (a.cargaAtiva !== b.cargaAtiva) {
      return a.cargaAtiva - b.cargaAtiva;
    }

    if (!a.ultimaAtribuicao && b.ultimaAtribuicao) {
      return -1;
    }

    if (a.ultimaAtribuicao && !b.ultimaAtribuicao) {
      return 1;
    }

    if (a.ultimaAtribuicao && b.ultimaAtribuicao) {
      const diferenca = a.ultimaAtribuicao.getTime() - b.ultimaAtribuicao.getTime();

      if (diferenca !== 0) {
        return diferenca;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Seleciona o atendente ativo com menor carga aberta no setor informado.
 */
export async function selecionarResponsavelAutomaticamente(setorId: string) {
  const atendentes = await prisma.usuario.findMany({
    where: {
      setorId,
      ativo: true,
      perfil: "ATENDENTE",
    },
    include: {
      _count: {
        select: {
          chamadosResponsaveis: {
            where: { status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
          },
        },
      },
    },
  });

  const ordenados = ordenarResponsaveisPorCarga(
    atendentes.map((atendente) => ({
      ...atendente,
      cargaAtiva: atendente._count.chamadosResponsaveis,
    })),
  );

  return ordenados[0] ?? null;
}

/**
 * Atribui um chamado ao atendente selecionado automaticamente.
 */
export async function atribuirChamadoAutomaticamente(chamadoId: string, setorId: string) {
  const responsavel = await selecionarResponsavelAutomaticamente(setorId);

  if (!responsavel) {
    return null;
  }

  const agora = new Date();

  await prisma.$transaction(async (transacao) => {
    await transacao.chamado.update({
      where: { id: chamadoId },
      data: { responsavelId: responsavel.id },
    });
    await transacao.usuario.update({
      where: { id: responsavel.id },
      data: { ultimaAtribuicao: agora },
    });
  });

  return responsavel;
}

/**
 * Registra a data da Ãºltima atribuiÃ§Ã£o apÃ³s criaÃ§Ã£o automÃ¡tica jÃ¡ vinculada.
 */
export async function registrarUltimaAtribuicaoResponsavel(responsavelId: string, agora = new Date()): Promise<void> {
  await prisma.usuario.update({
    where: { id: responsavelId },
    data: { ultimaAtribuicao: agora },
  });
}
