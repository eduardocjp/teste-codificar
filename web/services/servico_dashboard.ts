import { prisma } from "../lib/prisma";
import { STATUS_CHAMADOS_ATIVOS } from "../types/dominio";
import type { SessaoUsuario } from "../types/usuario";

/**
 * Consolida métricas do dashboard sem depender de biblioteca de gráficos.
 */
export async function obterDadosDashboard(sessao: SessaoUsuario) {
  const filtroAtendente = sessao.perfil === "ATENDENTE" ? { responsavelId: sessao.id } : {};

  const [porStatus, altaPrioridade, semResponsavel, recentes, cargaAtendentes] = await Promise.all([
    prisma.chamado.groupBy({
      by: ["status"],
      where: filtroAtendente,
      _count: { _all: true },
    }),
    prisma.chamado.count({
      where: { ...filtroAtendente, prioridade: "ALTA", status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
    }),
    prisma.chamado.count({
      where: { ...filtroAtendente, responsavelId: null, status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
    }),
    prisma.chamado.findMany({
      where: filtroAtendente,
      include: {
        setor: { select: { nome: true } },
        responsavel: { select: { nome: true } },
      },
      orderBy: { dataAbertura: "desc" },
      take: 6,
    }),
    prisma.usuario.findMany({
      where: { perfil: "ATENDENTE", ativo: true },
      include: {
        setor: { select: { nome: true } },
        _count: {
          select: {
            chamadosResponsaveis: {
              where: { status: { in: [...STATUS_CHAMADOS_ATIVOS] } },
            },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  return {
    porStatus,
    altaPrioridade,
    semResponsavel,
    recentes,
    cargaAtendentes,
  };
}
