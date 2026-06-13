import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { analisarMensagemIntentSolver } from "../modules/intents/servico_intencao";
import { ORIGENS_CHAMADO, type OrigemChamadoValor } from "../types/dominio";
import { logError } from "../utils/logger";

function obterOrigemValida(valor: unknown): OrigemChamadoValor | undefined {
  if (typeof valor !== "string") {
    return undefined;
  }

  return ORIGENS_CHAMADO.includes(valor as OrigemChamadoValor) ? (valor as OrigemChamadoValor) : undefined;
}

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
    const origem = typeof body === "object" && body && "origem" in body ? obterOrigemValida(body.origem) : undefined;
    const resultado = origem
      ? await analisarMensagemIntentSolver(mensagem, origem)
      : await analisarMensagemIntentSolver(mensagem);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerIntentSolver", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível analisar a solicitação." }, { status: 500 });
  }
}
