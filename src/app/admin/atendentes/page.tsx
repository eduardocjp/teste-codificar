import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../../web/lib/auth";
import { listarAtendentesParaAdministracao } from "../../../../web/modules/responsaveis/servico_responsavel";
import { obterSetoresParaSelecao } from "../../../../web/modules/setores/servico_setor";
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

  const [responsaveis, setores] = await Promise.all([
    listarAtendentesParaAdministracao(),
    obterSetoresParaSelecao(),
  ]);

  return (
    <SystemLayout sessao={sessao}>
      <AdminAtendentesView responsaveis={responsaveis} setores={setores} />
    </SystemLayout>
  );
}
