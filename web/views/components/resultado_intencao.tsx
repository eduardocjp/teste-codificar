import type { ResultadoResolucaoIntencao } from "../../types/intencao";
import { BadgePrioridade } from "./badge_prioridade";

type ResultadoIntencaoProps = {
  resultado: ResultadoResolucaoIntencao | null;
};

export function ResultadoIntencao({ resultado }: ResultadoIntencaoProps) {
  if (!resultado) {
    return null;
  }

  return (
    <div className="rounded-[28px] bg-fog p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">
          {resultado.identificada ? resultado.nomeIntencao : "Intenção não identificada"}
        </span>
        <BadgePrioridade prioridade={resultado.prioridadeSugerida} />
        <span className="text-xs text-steel">{Math.round(resultado.confianca * 100)}% de confiança</span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-steel">Assunto</dt>
          <dd className="font-medium text-ink">{resultado.assuntoSugerido}</dd>
        </div>
        <div>
          <dt className="text-xs text-steel">Setor</dt>
          <dd className="font-medium text-ink">{resultado.setorNome}</dd>
        </div>
      </dl>
      {resultado.termosEncontrados.length > 0 ? (
        <p className="mt-3 text-xs text-steel">Termos encontrados: {resultado.termosEncontrados.join(", ")}</p>
      ) : null}
    </div>
  );
}
