import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { AdminView } from "../../../web/views/in-app/admin";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  if (sessao.perfil !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  return (
    <SystemLayout sessao={sessao}>
      <AdminView />
    </SystemLayout>
  );
}
