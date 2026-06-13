import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { SimuladorView } from "../../../web/views/in-app/simulador";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  return (
    <SystemLayout sessao={sessao}>
      <SimuladorView />
    </SystemLayout>
  );
}
