import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { listarConversasAtendimento } from "../../../web/services/servico_conversa";
import { ConversaView } from "../../../web/views/in-app/conversa";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function ConversasPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const conversas = await listarConversasAtendimento(sessao);

  return (
    <SystemLayout sessao={sessao}>
      <ConversaView conversas={conversas} perfil={sessao.perfil} />
    </SystemLayout>
  );
}
