import Link from "next/link";

import type { ChamadoComRelacoes } from "../../types/chamado";
import { formatarDataHora } from "../../utils/utils";
import { Button } from "../ui/button";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { BadgeOrigem } from "../components/badge_origem";
import { BadgePrioridade } from "../components/badge_prioridade";
import { BadgeStatus } from "../components/badge_status";

type DetalheChamadoViewProps = {
  chamado: ChamadoComRelacoes;
};

export function DetalheChamadoView({ chamado }: DetalheChamadoViewProps) {
  return (
    <section>
      <CabecalhoPagina
        titulo={chamado.titulo}
        descricao={chamado.assunto ?? "Detalhes e histórico do chamado."}
        acao={
          <Button asChild className="rounded-full bg-obsidian text-snow shadow-subtle">
            <Link href={`/chamados/${chamado.id}/editar`}>Editar</Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <article className="rounded-[36px] bg-snow p-6 ring-1 ring-fog">
          <div className="flex flex-wrap gap-2">
            <BadgeStatus status={chamado.status} />
            <BadgePrioridade prioridade={chamado.prioridade} />
            <BadgeOrigem origem={chamado.origem} />
          </div>
          <h2 className="mt-6 text-sm font-semibold uppercase text-steel">Descrição</h2>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-ink">{chamado.descricao}</p>
        </article>

        <aside className="rounded-[36px] bg-snow p-6 ring-1 ring-fog">
          <h2 className="text-lg font-semibold text-ink">Dados do chamado</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-steel">Setor</dt>
              <dd className="font-medium text-ink">{chamado.setor.nome}</dd>
            </div>
            <div>
              <dt className="text-steel">Responsável</dt>
              <dd className="font-medium text-ink">{chamado.responsavel?.nome ?? "Sem atendente disponível"}</dd>
            </div>
            <div>
              <dt className="text-steel">Intenção</dt>
              <dd className="font-medium text-ink">{chamado.intencao?.nome ?? "Não identificada"}</dd>
            </div>
            <div>
              <dt className="text-steel">Confiança</dt>
              <dd className="font-medium text-ink">
                {chamado.confiancaIntencao === null ? "Não analisado" : `${Math.round(chamado.confiancaIntencao * 100)}%`}
              </dd>
            </div>
            <div>
              <dt className="text-steel">Abertura</dt>
              <dd className="font-medium text-ink">{formatarDataHora(chamado.dataAbertura)}</dd>
            </div>
            {chamado.dataResolucao ? (
              <div>
                <dt className="text-steel">Resolução</dt>
                <dd className="font-medium text-ink">{formatarDataHora(chamado.dataResolucao)}</dd>
              </div>
            ) : null}
            {chamado.dataFechamento ? (
              <div>
                <dt className="text-steel">Fechamento</dt>
                <dd className="font-medium text-ink">{formatarDataHora(chamado.dataFechamento)}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </section>
  );
}
