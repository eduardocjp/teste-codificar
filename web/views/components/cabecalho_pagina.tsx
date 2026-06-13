import type { ReactNode } from "react";

type CabecalhoPaginaProps = {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
};

export function CabecalhoPagina({ titulo, descricao, acao }: CabecalhoPaginaProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold leading-tight text-obsidian">{titulo}</h1>
        {descricao ? <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">{descricao}</p> : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}
