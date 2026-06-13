import Link from "next/link";

import { FormularioLogin } from "../forms/formulario_login";

export function LoginView() {
  return (
    <main className="min-h-screen bg-mist px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1100px] gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <span className="flex size-9 items-center justify-center rounded-full bg-obsidian text-snow">SC</span>
            Sistema de Chamados
          </Link>
          <h1 className="mt-10 max-w-2xl text-5xl font-semibold leading-tight text-obsidian">
            Acesse o painel para acompanhar e resolver demandas internas.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-steel">
            Use os usuários do seed para testar o MVP local depois de configurar o Supabase PostgreSQL.
          </p>
        </section>

        <section className="rounded-[36px] bg-snow p-6 ring-1 ring-fog sm:p-8">
          <h2 className="text-2xl font-semibold text-obsidian">Entrar</h2>
          <p className="mt-2 text-sm text-steel">Informe suas credenciais para continuar.</p>
          <div className="mt-6">
            <FormularioLogin />
          </div>
          <div className="mt-5 rounded-[24px] bg-fog p-4 text-sm text-graphite">
            <p className="font-medium">Demonstração após seed</p>
            <p className="mt-1">admin@empresa.com / admin123</p>
            <p>ana@empresa.com / atendente123</p>
          </div>
        </section>
      </div>
    </main>
  );
}
