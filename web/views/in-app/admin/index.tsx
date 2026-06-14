import Link from "next/link";

import { Button } from "../../ui/button";
import { CabecalhoPagina } from "../../components/cabecalho_pagina";
import { ConectarEmail } from "../../components/conectar_email";
import { QrCodeConexao } from "../../components/qr_code";
import { UserRoundCog } from "../../../utils/icons";

export function AdminView() {
  return (
    <section>
      <CabecalhoPagina
        titulo="Admin"
        descricao="Área administrativa para usuários, atendentes e canais de entrada do sistema."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[36px] bg-snow p-6 ring-1 ring-fog">
          <div className="flex size-11 items-center justify-center rounded-full bg-obsidian text-snow">
            <UserRoundCog className="size-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-ink">Usuários e atendentes</h2>
          <p className="mt-2 text-sm leading-6 text-steel">
            Acesse a administração de contas para criar atendentes, associar usuários a setores e editar dados dos
            responsáveis.
          </p>
          <Button asChild className="mt-5 rounded-full bg-obsidian text-snow shadow-subtle">
            <Link href="/admin/atendentes">Editar usuários</Link>
          </Button>
        </div>

        <div className="rounded-[36px] bg-snow p-6 ring-1 ring-fog">
          <p className="text-xs font-medium uppercase text-steel">Canais de entrada</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Conexões para chamados automáticos</h2>
          <p className="mt-2 text-sm leading-6 text-steel">
            Conecte o WhatsApp via Evolution usando a VPS configurada no .env e mantenha o e-mail preparado para
            recebimento futuro.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <QrCodeConexao />
            <ConectarEmail />
          </div>
        </div>
      </div>
    </section>
  );
}
