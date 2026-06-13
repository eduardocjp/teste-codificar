import { CabecalhoPagina } from "../components/cabecalho_pagina";

type ConfiguracoesViewProps = {
  intencoes: Array<{
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
    setor: { nome: string };
    prioridadeSugerida: string;
    confiancaMinima: number;
  }>;
};

export function ConfiguracoesView({ intencoes }: ConfiguracoesViewProps) {
  return (
    <section>
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Configuração simples das intenções usadas pelo Intent Solver."
      />
      <div className="rounded-[36px] bg-snow p-5 ring-1 ring-fog">
        <h2 className="text-xl font-semibold text-ink">Intenções cadastradas</h2>
        <div className="mt-4 grid gap-3">
          {intencoes.map((intencao) => (
            <article key={intencao.id} className="rounded-[24px] bg-mist p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{intencao.nome}</h3>
                  <p className="text-xs text-steel">
                    {intencao.slug} · {intencao.setor.nome}
                  </p>
                </div>
                <span className="rounded-full bg-fog px-2 py-1 text-xs text-graphite">
                  {intencao.ativo ? "Ativa" : "Inativa"}
                </span>
              </div>
              <p className="mt-2 text-sm text-steel">
                Prioridade {intencao.prioridadeSugerida} · Confiança mínima {Math.round(intencao.confiancaMinima * 100)}%
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
