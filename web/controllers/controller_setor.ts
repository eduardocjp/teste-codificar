import { NextResponse } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { obterSetoresParaSelecao } from "../modules/setores/servico_setor";
import { logError } from "../utils/logger";

/**
 * Lista setores ativos para formulários e filtros.
 */
export async function controllerListarSetores(): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const setores = await obterSetoresParaSelecao();
    return NextResponse.json({ sucesso: true, dados: setores });
  } catch (erro) {
    logError("controllerListarSetores", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível listar setores." }, { status: 500 });
  }
}
