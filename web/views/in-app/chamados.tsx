import Link from "next/link";

import type { ChamadoComRelacoes } from "../../types/chamado";
import { Plus } from "../../utils/icons";
import { Button } from "../ui/button";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { FiltrosChamados } from "../components/filtros_chamados";
import { TabelaChamados } from "../components/tabela_chamados";

type Opcao = {
  id: string;
  nome: string;
};

type ChamadosViewProps = {
  chamados: ChamadoComRelacoes[];
  total: number;
  setores: Opcao[];
  responsaveis: Opcao[];
  filtros: Record<string, string | undefined>;
};

export function ChamadosView({ chamados, total, setores, responsaveis, filtros }: ChamadosViewProps) {
  return (
    <section>
      <CabecalhoPagina
        titulo="Chamados"
        descricao={`${total} chamado(s) encontrados. Filtre, acompanhe e abra novas solicitações.`}
        acao={
          <Button asChild className="rounded-full bg-obsidian text-snow shadow-subtle">
            <Link href="/chamados/novo">
              <Plus className="size-4" />
              Novo chamado
            </Link>
          </Button>
        }
      />
      <FiltrosChamados setores={setores} responsaveis={responsaveis} valores={filtros} />
      <TabelaChamados chamados={chamados} />
    </section>
  );
}
