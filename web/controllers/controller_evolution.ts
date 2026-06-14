import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { desconectarEvolution, conectarEvolution, obterStatusEvolution } from "../services/servico_evolution";
import { obterEnv } from "../lib/env";
import { logError, logInfo } from "../utils/logger";

function respostaNaoAutorizada(status = 403): NextResponse {
  return NextResponse.json({ sucesso: false, mensagem: "Você não possui permissão." }, { status });
}

/**
 * Consulta o estado da conexão WhatsApp na Evolution API.
 */
export async function controllerStatusEvolution(): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return respostaNaoAutorizada(403);
  }

  try {
    const resultado = await obterStatusEvolution();
    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerStatusEvolution", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível consultar a Evolution API." }, { status: 500 });
  }
}

/**
 * Cria ou conecta a instância única na Evolution API e retorna QR Code.
 */
export async function controllerConectarEvolution(): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return respostaNaoAutorizada(403);
  }

  try {
    const resultado = await conectarEvolution();
    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerConectarEvolution", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível conectar a Evolution API." }, { status: 500 });
  }
}

/**
 * Exclui a instância única na Evolution API.
 */
export async function controllerDesconectarEvolution(): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return respostaNaoAutorizada(403);
  }

  try {
    const resultado = await desconectarEvolution();
    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerDesconectarEvolution", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível desconectar a Evolution API." }, { status: 500 });
  }
}

/**
 * Recebe eventos da Evolution API usando o segredo configurado no webhook.
 */
export async function controllerWebhookEvolution(request: NextRequest): Promise<NextResponse> {
  const env = obterEnv();

  if (env.EVOLUTION_API_HABILITADA !== "true") {
    return NextResponse.json({
      sucesso: false,
      mensagem: "Integração Evolution API desabilitada.",
    }, { status: 404 });
  }

  const segredo = env.EVOLUTION_WEBHOOK_SEGREDO?.trim();

  if (segredo) {
    const segredoHeader = request.headers.get("x-webhook-secret");
    const authorization = request.headers.get("authorization");
    const authorizationValido = authorization === `Bearer ${segredo}`;

    if (segredoHeader !== segredo && !authorizationValido) {
      return NextResponse.json({ sucesso: false, mensagem: "Webhook não autorizado." }, { status: 401 });
    }
  }

  const body = await lerJsonSeguro(request);
  const evento = typeof body === "object" && body !== null && "event" in body && typeof body.event === "string"
    ? body.event
    : "evento_desconhecido";

  logInfo("controllerWebhookEvolution", { evento });

  return NextResponse.json({
    sucesso: true,
    mensagem: "Evento recebido.",
  });
}
