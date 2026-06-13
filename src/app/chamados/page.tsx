import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { listarResponsaveis } from "../../../web/modules/responsaveis/servico_responsavel";
import { obterSetoresParaSelecao } from "../../../web/modules/setores/servico_setor";
import { obterChamados } from "../../../web/modules/tickets/servico_chamado";
import { ChamadosView } from "../../../web/views/in-app/chamados";
import { SystemLayout } from "../../../web/views/layout/system_layout";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function montarSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [chave, valor] of Object.entries(params)) {
    if (typeof valor === "string") {
      searchParams.set(chave, valor);
    }
  }

  return searchParams;
}

export default async function ChamadosPage({ searchParams }: PageProps) {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    redirect("/login");
  }

  const params = await searchParams;
  const urlSearchParams = montarSearchParams(params);
  const [dados, setores, responsaveis] = await Promise.all([
    obterChamados(urlSearchParams, sessao),
    obterSetoresParaSelecao(),
    listarResponsaveis(),
  ]);

  return (
    <SystemLayout sessao={sessao}>
      <ChamadosView
        chamados={dados.chamados}
        total={dados.total}
        setores={setores.map((setor) => ({ id: setor.id, nome: setor.nome }))}
        responsaveis={responsaveis.map((responsavel) => ({ id: responsavel.id, nome: responsavel.nome }))}
        filtros={Object.fromEntries(urlSearchParams.entries())}
      />
    </SystemLayout>
  );
}
