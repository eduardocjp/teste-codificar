import { NextResponse } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { finalizarConversaWhatsapp } from "../services/servico_conversa";
import { logError } from "../utils/logger";

/**
 * Finaliza uma sessão de conversa do WhatsApp.
 */
export async function controllerFinalizarConversaWhatsapp(id: string): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const resultado = await finalizarConversaWhatsapp(id, sessao.dados);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerFinalizarConversaWhatsapp", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível finalizar a conversa." }, { status: 500 });
  }
}
