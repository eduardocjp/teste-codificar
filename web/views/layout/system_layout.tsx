import Link from "next/link";

import type { ReactNode } from "react";
import type { SessaoUsuario } from "../../types/usuario";
import { cn } from "../../utils/utils";
import {
  Bot,
  Gauge,
  Inbox,
  MessageSquareText,
  Settings,
  Shield,
  Users,
} from "../../utils/icons";
import { Footer } from "./footer";
import { Head } from "./head";

type SystemLayoutProps = {
  children: ReactNode;
  sessao: SessaoUsuario;
};

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, admin: false },
  { href: "/chamados", label: "Chamados", icon: Inbox, admin: false },
  { href: "/responsaveis", label: "Responsáveis", icon: Users, admin: false },
  { href: "/simulador", label: "Simulador", icon: Bot, admin: false },
  { href: "/conversas", label: "Conversas", icon: MessageSquareText, admin: false },
  { href: "/configuracoes", label: "Configurações", icon: Settings, admin: false },
  { href: "/admin/atendentes", label: "Admin", icon: Shield, admin: true },
] as const;

export function SystemLayout({ children, sessao }: SystemLayoutProps) {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <Head sessao={sessao} />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row">
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-64">
          <nav className="flex gap-2 overflow-x-auto rounded-[28px] bg-snow p-2 shadow-sm ring-1 ring-fog lg:flex-col lg:overflow-visible">
            {links
              .filter((link) => !link.admin || sessao.perfil === "ADMINISTRADOR")
              .map((link) => {
                const Icone = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex min-w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-steel transition hover:bg-mist hover:text-ink lg:min-w-0",
                    )}
                  >
                    <Icone className="size-4" />
                    {link.label}
                  </Link>
                );
              })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
