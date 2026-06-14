import type { ReactNode } from "react";

import type { SessaoUsuario } from "../../types/usuario";
import { Footer } from "./footer";
import { Head } from "./head";
import { NavegacaoSistema } from "./navegacao_sistema";

type SystemLayoutProps = {
  children: ReactNode;
  sessao: SessaoUsuario;
};

export function SystemLayout({ children, sessao }: SystemLayoutProps) {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <Head sessao={sessao} />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row">
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-64">
          <NavegacaoSistema perfil={sessao.perfil} />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
