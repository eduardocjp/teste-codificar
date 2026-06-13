import Link from "next/link";

import { ArrowRight, CheckCircle2, Ticket, Users, Bot } from "../../utils/icons";
import { Button } from "../ui/button";
import { PublicFooter } from "./public-components/footer";
import { PublicHead } from "./public-components/head";

const beneficios = [
  "Registro centralizado de solicitações internas",
  "Distribuição automática por menor carga ativa",
  "Intent Solver determinístico para sugerir setor e prioridade",
  "Operação completa sem depender de WhatsApp ou Evolution API",
];

export function InicioView() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <PublicHead />
      <main className="mx-auto grid max-w-[1200px] gap-16 px-4 py-10 sm:px-6 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-snow px-3 py-1 text-xs font-semibold text-graphite ring-1 ring-fog">
              Controle interno de chamados
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] text-obsidian sm:text-6xl">
              Chamados organizados, atribuídos e acompanhados em um só lugar.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-steel">
              Cadastre demandas manualmente, classifique com apoio do Intent Solver e distribua trabalho entre atendentes com uma regra simples e auditável.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-full bg-obsidian px-5 text-snow shadow-subtle">
                <Link href="/login">
                  Entrar
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full">
                <Link href="/login">Acessar demonstração</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[36px] bg-obsidian p-5 text-snow">
            <div className="grid gap-3">
              {[
                { icon: Ticket, label: "Chamados", value: "CRUD completo" },
                { icon: Users, label: "Atendentes", value: "Carga equilibrada" },
                { icon: Bot, label: "Intent Solver", value: "Sugestões locais" },
              ].map((item) => {
                const Icone = item.icon;

                return (
                  <div key={item.label} className="rounded-[28px] bg-white/10 p-4 ring-1 ring-white/10">
                    <Icone className="mb-5 size-6 text-ash" />
                    <p className="text-sm text-ash">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {beneficios.map((beneficio) => (
            <div key={beneficio} className="flex items-start gap-3 rounded-[28px] bg-snow p-5 ring-1 ring-fog">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-graphite" />
              <p className="text-sm leading-6 text-ink">{beneficio}</p>
            </div>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
