import type { ReactNode } from "react";

type EstadoVazioProps = {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
};

export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="rounded-[36px] bg-snow p-8 text-center ring-1 ring-fog">
      <h2 className="text-xl font-semibold text-ink">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-steel">{descricao}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
