import { notFound, redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../../web/lib/auth";
import { buscarChamadoPorId } from "../../../../web/modules/tickets/repositorio_chamado";
import { DetalheChamadoView } from "../../../../web/views/in-app/detalhe_chamado";
import { SystemLayout } from "../../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DetalheChamadoPage({ params }: PageProps) {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const { id } = await params;
  const chamado = await buscarChamadoPorId(id, sessao);

  if (!chamado) {
    notFound();
  }

  return (
    <SystemLayout sessao={sessao}>
      <DetalheChamadoView chamado={chamado} />
    </SystemLayout>
  );
}
