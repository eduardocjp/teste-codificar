import Link from "next/link";

import type { SessaoUsuario } from "../../types/usuario";
import { Button } from "../ui/button";
import { LogOut } from "../../utils/icons";

type HeadProps = {
  sessao: SessaoUsuario;
};

export function Head({ sessao }: HeadProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-fog/80 bg-snow/85 backdrop-blur-md">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-obsidian text-sm font-semibold text-snow">
            SC
          </span>
          <span className="hidden text-sm font-semibold text-ink sm:inline">Sistema de Chamados</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{sessao.nome}</p>
            <p className="text-xs text-steel">{sessao.perfil === "ADMINISTRADOR" ? "Administrador" : "Atendente"}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="outline" size="sm" className="rounded-full">
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
