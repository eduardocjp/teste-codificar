import Link from "next/link";

import { Button } from "../../ui/button";
import { CabecalhoPagina } from "../../components/cabecalho_pagina";

export function AdminView() {
  return (
    <section>
      <CabecalhoPagina titulo="Admin" descricao="Área administrativa do sistema." />
      <div className="rounded-[36px] bg-snow p-6 ring-1 ring-fog">
        <h2 className="text-xl font-semibold text-ink">Atendentes</h2>
        <p className="mt-2 text-sm text-steel">Gerencie usuários atendentes e suas cargas de chamados.</p>
        <Button asChild className="mt-5 rounded-full bg-obsidian text-snow shadow-subtle">
          <Link href="/admin/atendentes">Abrir atendentes</Link>
        </Button>
      </div>
    </section>
  );
}
