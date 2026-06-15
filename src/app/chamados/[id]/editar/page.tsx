import { notFound, redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../../../web/lib/auth";
import { listarResponsaveis } from "../../../../../web/modules/responsaveis/servico_responsavel";
import { obterSetoresParaSelecao } from "../../../../../web/modules/setores/servico_setor";
import { buscarChamadoPorId } from "../../../../../web/modules/tickets/repositorio_chamado";
import { FormularioChamadoView } from "../../../../../web/views/in-app/formulario_chamado_view";
import { SystemLayout } from "../../../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarChamadoPage({ params }: PageProps) {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const { id } = await params;
  const chamado = await buscarChamadoPorId(id, sessao);
  const setores = await obterSetoresParaSelecao();
  const responsaveis = await listarResponsaveis();

  if (!chamado) {
    notFound();
  }

  return (
    <SystemLayout sessao={sessao}>
      <FormularioChamadoView
        chamado={chamado}
        setores={setores.map((setor) => ({ id: setor.id, nome: setor.nome }))}
        responsaveis={responsaveis.map((responsavel) => ({
          id: responsavel.id,
          nome: responsavel.nome,
          setorId: responsavel.setorId,
        }))}
      />
    </SystemLayout>
  );
}
