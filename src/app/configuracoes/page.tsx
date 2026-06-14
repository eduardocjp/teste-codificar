import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { obterIntencoes } from "../../../web/modules/intents/servico_intencao";
import { obterSetoresParaSelecao } from "../../../web/modules/setores/servico_setor";
import { ConfiguracoesView } from "../../../web/views/in-app/configuracoes";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const [intencoes, setores] = await Promise.all([obterIntencoes(), obterSetoresParaSelecao()]);

  return (
    <SystemLayout sessao={sessao}>
      <ConfiguracoesView intencoes={intencoes} setores={setores} />
    </SystemLayout>
  );
}
