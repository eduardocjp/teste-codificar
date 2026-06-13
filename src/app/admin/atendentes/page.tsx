import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../../web/lib/auth";
import { listarResponsaveis } from "../../../../web/modules/responsaveis/servico_responsavel";
import { AdminAtendentesView } from "../../../../web/views/in-app/admin/atendentes";
import { SystemLayout } from "../../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function AdminAtendentesPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  if (sessao.perfil !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  const responsaveis = await listarResponsaveis();

  return (
    <SystemLayout sessao={sessao}>
      <AdminAtendentesView responsaveis={responsaveis} />
    </SystemLayout>
  );
}
