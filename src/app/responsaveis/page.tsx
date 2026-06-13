import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { listarResponsaveis } from "../../../web/modules/responsaveis/servico_responsavel";
import { ResponsaveisView } from "../../../web/views/in-app/responsaveis";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function ResponsaveisPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const responsaveis = await listarResponsaveis();

  return (
    <SystemLayout sessao={sessao}>
      <ResponsaveisView responsaveis={responsaveis} />
    </SystemLayout>
  );
}
