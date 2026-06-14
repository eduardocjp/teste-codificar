"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

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

type LinkNavegacao = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  admin: boolean;
};

type NavegacaoSistemaProps = {
  perfil: SessaoUsuario["perfil"];
};

const links: LinkNavegacao[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, admin: false },
  { href: "/chamados", label: "Chamados", icon: Inbox, admin: false },
  { href: "/responsaveis", label: "Responsáveis", icon: Users, admin: false },
  { href: "/simulador", label: "Simulador", icon: Bot, admin: false },
  { href: "/conversas", label: "Conversas", icon: MessageSquareText, admin: false },
  { href: "/configuracoes", label: "Configurações", icon: Settings, admin: false },
  { href: "/admin", label: "Admin", icon: Shield, admin: true },
];

function linkEstaAtivo(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Renderiza a navegação lateral marcando visualmente a rota ativa.
 */
export function NavegacaoSistema({ perfil }: NavegacaoSistemaProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-[28px] bg-snow p-2 shadow-sm ring-1 ring-fog lg:flex-col lg:overflow-visible">
      {links
        .filter((link) => !link.admin || perfil === "ADMINISTRADOR")
        .map((link) => {
          const Icone = link.icon;
          const ativo = linkEstaAtivo(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex min-w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition lg:min-w-0",
                ativo
                  ? "bg-obsidian text-snow shadow-subtle hover:bg-obsidian hover:text-snow"
                  : "text-steel hover:bg-mist hover:text-ink",
              )}
            >
              <Icone className="size-4" />
              {link.label}
            </Link>
          );
        })}
    </nav>
  );
}
