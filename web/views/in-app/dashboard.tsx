import Link from "next/link";

import { LABEL_STATUS, STATUS_CHAMADO } from "../../types/dominio";
import { formatarDataHora } from "../../utils/utils";
import { Button } from "../ui/button";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { BadgeStatus } from "../components/badge_status";
import { BadgePrioridade } from "../components/badge_prioridade";

type DashboardViewProps = {
  dados: Awaited<ReturnType<typeof import("../../services/servico_dashboard").obterDadosDashboard>>;
};

export function DashboardView({ dados }: DashboardViewProps) {
  const contagemPorStatus = new Map(dados.porStatus.map((item) => [item.status, item._count._all]));

  return (
    <section>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao="Visão geral dos chamados ativos, prioridades e distribuição de carga."
        acao={
          <Button asChild className="rounded-full bg-obsidian text-snow shadow-subtle">
            <Link href="/chamados/novo">Novo chamado</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {STATUS_CHAMADO.map((status) => (
          <div key={status} className="rounded-[28px] bg-snow p-5 ring-1 ring-fog">
            <p className="text-xs text-steel">{LABEL_STATUS[status]}</p>
            <p className="mt-2 text-3xl font-semibold text-obsidian">{contagemPorStatus.get(status) ?? 0}</p>
          </div>
        ))}
        <div className="rounded-[28px] bg-obsidian p-5 text-snow">
          <p className="text-xs text-ash">Alta prioridade</p>
          <p className="mt-2 text-3xl font-semibold">{dados.altaPrioridade}</p>
        </div>
        <div className="rounded-[28px] bg-snow p-5 ring-1 ring-fog">
          <p className="text-xs text-steel">Sem responsável</p>
          <p className="mt-2 text-3xl font-semibold text-obsidian">{dados.semResponsavel}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[36px] bg-snow p-5 ring-1 ring-fog">
          <h2 className="text-xl font-semibold text-ink">Chamados recentes</h2>
          <div className="mt-4 grid gap-3">
            {dados.recentes.map((chamado) => (
              <Link key={chamado.id} href={`/chamados/${chamado.id}`} className="rounded-[24px] bg-mist p-4">
                <div className="flex flex-wrap gap-2">
                  <BadgeStatus status={chamado.status} />
                  <BadgePrioridade prioridade={chamado.prioridade} />
                </div>
                <p className="mt-3 font-semibold text-ink">{chamado.titulo}</p>
                <p className="mt-1 text-sm text-steel">{chamado.setor.nome} · {formatarDataHora(chamado.dataAbertura)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] bg-snow p-5 ring-1 ring-fog">
          <h2 className="text-xl font-semibold text-ink">Carga por atendente</h2>
          <div className="mt-4 grid gap-3">
            {dados.cargaAtendentes.map((atendente) => (
              <div key={atendente.id} className="rounded-[24px] bg-mist p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{atendente.nome}</p>
                    <p className="text-xs text-steel">{atendente.setor?.nome ?? "Sem setor"}</p>
                  </div>
                  <span className="text-2xl font-semibold text-obsidian">{atendente._count.chamadosResponsaveis}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-fog">
                  <div className="h-2 rounded-full bg-obsidian" style={{ width: `${Math.min(atendente._count.chamadosResponsaveis * 20, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
