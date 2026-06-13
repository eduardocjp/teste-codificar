import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { obterDadosDashboard } from "../../../web/services/servico_dashboard";
import { DashboardView } from "../../../web/views/in-app/dashboard";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const dados = await obterDadosDashboard(sessao);

  return (
    <SystemLayout sessao={sessao}>
      <DashboardView dados={dados} />
    </SystemLayout>
  );
}
