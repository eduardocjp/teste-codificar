import { CabecalhoPagina } from "../components/cabecalho_pagina";

type ResponsavelLista = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  setor: { nome: string } | null;
  ultimaAtribuicao: Date | null;
  _count: { chamadosResponsaveis: number };
};

type ResponsaveisViewProps = {
  responsaveis: ResponsavelLista[];
};

export function ResponsaveisView({ responsaveis }: ResponsaveisViewProps) {
  return (
    <section>
      <CabecalhoPagina
        titulo="Responsáveis"
        descricao="Atendentes ativos disponíveis para atribuição manual e distribuição automática."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {responsaveis.map((responsavel) => (
          <article key={responsavel.id} className="rounded-[28px] bg-snow p-5 ring-1 ring-fog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink">{responsavel.nome}</h2>
                <p className="text-sm text-steel">{responsavel.email}</p>
              </div>
              <span className="rounded-full bg-fog px-2 py-1 text-xs text-graphite">
                {responsavel.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs text-steel">Setor</p>
                <p className="font-medium text-ink">{responsavel.setor?.nome ?? "Sem setor"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-steel">Carga ativa</p>
                <p className="text-3xl font-semibold text-obsidian">{responsavel._count.chamadosResponsaveis}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
