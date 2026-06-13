import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../../web/lib/auth";
import { listarResponsaveis } from "../../../../web/modules/responsaveis/servico_responsavel";
import { obterSetoresParaSelecao } from "../../../../web/modules/setores/servico_setor";
import { FormularioChamadoView } from "../../../../web/views/in-app/formulario_chamado_view";
import { SystemLayout } from "../../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

export default async function NovoChamadoPage() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const [setores, responsaveis] = await Promise.all([obterSetoresParaSelecao(), listarResponsaveis()]);

  return (
    <SystemLayout sessao={sessao}>
      <FormularioChamadoView
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
