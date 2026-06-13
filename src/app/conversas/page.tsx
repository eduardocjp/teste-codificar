import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { ConversaView } from "../../../web/views/in-app/conversa";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function ConversasPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  return (
    <SystemLayout sessao={sessao}>
      <ConversaView />
    </SystemLayout>
  );
}
