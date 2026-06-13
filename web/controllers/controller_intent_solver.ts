import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { analisarMensagemIntentSolver } from "../modules/intents/servico_intencao";
import { logError } from "../utils/logger";

/**
 * Analisa uma solicitação em linguagem natural pelo Intent Solver.
 */
export async function controllerIntentSolver(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const mensagem = typeof body === "object" && body && "mensagem" in body ? String(body.mensagem) : "";
    const resultado = await analisarMensagemIntentSolver(mensagem);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerIntentSolver", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível analisar a solicitação." }, { status: 500 });
  }
}
