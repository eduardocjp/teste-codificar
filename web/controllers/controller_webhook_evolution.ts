import { NextResponse } from "next/server";

import { obterEnv } from "../lib/env";

/**
 * Webhook opcional da Evolution API. Permanece desabilitado por padrão.
 */
export async function controllerWebhookEvolution(): Promise<NextResponse> {
  const env = obterEnv();

  if (env.EVOLUTION_API_HABILITADA !== "true") {
    return NextResponse.json({
      sucesso: false,
      mensagem: "Integração Evolution API desabilitada.",
    }, { status: 404 });
  }

  return NextResponse.json({
    sucesso: false,
    mensagem: "Integração Evolution API ainda não implementada.",
  }, { status: 501 });
}
