import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { processarCapturaSimulada } from "../services/servico_captura_simulada";
import { logError } from "../utils/logger";

/**
 * Processa captura simulada por e-mail ou WhatsApp.
 */
export async function controllerCapturaSimulada(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await processarCapturaSimulada(body);
    const status = resultado.sucesso && resultado.dados.chamado ? 201 : resultado.sucesso ? 200 : 400;

    return NextResponse.json(resultado, { status });
  } catch (erro) {
    logError("controllerCapturaSimulada", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível processar a simulação." }, { status: 500 });
  }
}
