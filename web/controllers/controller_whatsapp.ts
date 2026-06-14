import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { obterEnv } from "../lib/env";
import { lerJsonSeguro } from "../lib/respostas";
import { processarAgendamentosWhatsapp } from "../services/servico_agendamento_whatsapp";
import { obterConfiguracaoWhatsapp, salvarConfiguracaoWhatsapp } from "../services/servico_configuracao_whatsapp";
import { logError } from "../utils/logger";

function respostaNaoAutorizada(status = 403): NextResponse {
  return NextResponse.json({ sucesso: false, mensagem: "Você não possui permissão." }, { status });
}

function cronAutorizado(request: NextRequest): boolean {
  const segredo = obterEnv().CRON_SECRET?.trim();

  if (!segredo) {
    return false;
  }

  const header = request.headers.get("x-cron-secret");
  const authorization = request.headers.get("authorization");

  return header === segredo || authorization === `Bearer ${segredo}`;
}

/**
 * Retorna a configuração única do WhatsApp para a área administrativa.
 */
export async function controllerObterConfiguracaoWhatsapp(): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return respostaNaoAutorizada(403);
  }

  try {
    const configuracao = await obterConfiguracaoWhatsapp();
    return NextResponse.json({ sucesso: true, dados: configuracao });
  } catch (erro) {
    logError("controllerObterConfiguracaoWhatsapp", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível consultar a configuração." }, { status: 500 });
  }
}

/**
 * Atualiza ativação, números e mensagens automáticas do WhatsApp.
 */
export async function controllerSalvarConfiguracaoWhatsapp(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return respostaNaoAutorizada(403);
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await salvarConfiguracaoWhatsapp(body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerSalvarConfiguracaoWhatsapp", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível salvar a configuração." }, { status: 500 });
  }
}

/**
 * Processa confirmações pendentes de protocolo do WhatsApp via cron protegido.
 */
export async function controllerCronWhatsapp(request: NextRequest): Promise<NextResponse> {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ sucesso: false, mensagem: "Cron não autorizado." }, { status: 401 });
  }

  try {
    const resultado = await processarAgendamentosWhatsapp();
    return NextResponse.json(resultado, { status: 200 });
  } catch (erro) {
    logError("controllerCronWhatsapp", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível processar o cron." }, { status: 500 });
  }
}
