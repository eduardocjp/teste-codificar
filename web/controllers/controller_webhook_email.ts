import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { obterEnv } from "../lib/env";

function obterCredenciaisBasic(cabecalhoAutorizacao: string): { usuario: string; senha: string } | null {
  if (!cabecalhoAutorizacao.startsWith("Basic ")) {
    return null;
  }

  try {
    const token = cabecalhoAutorizacao.slice("Basic ".length);
    const decodificado = Buffer.from(token, "base64").toString("utf8");
    const separador = decodificado.indexOf(":");

    if (separador <= 0) {
      return null;
    }

    return {
      usuario: decodificado.slice(0, separador),
      senha: decodificado.slice(separador + 1),
    };
  } catch {
    return null;
  }
}

/**
 * Compara valores sensíveis em tempo constante quando os
 * tamanhos forem compatíveis.
 */
export function compararValorSensivel(valorRecebido: string, valorEsperado: string): boolean {
  const recebido = Buffer.from(valorRecebido);
  const esperado = Buffer.from(valorEsperado);

  if (recebido.length !== esperado.length) {
    return false;
  }

  return timingSafeEqual(recebido, esperado);
}

/**
 * Valida um cabeçalho HTTP Basic usando as credenciais
 * opcionais da configuração de ambiente.
 */
export function validarAutenticacaoWebhookEmail(cabecalhoAutorizacao: string | null): boolean {
  const env = obterEnv();
  const usuarioEsperado = env.POSTMARK_WEBHOOK_USUARIO?.trim();
  const senhaEsperada = env.POSTMARK_WEBHOOK_SENHA?.trim();

  if (!cabecalhoAutorizacao || !usuarioEsperado || !senhaEsperada) {
    return false;
  }

  const credenciais = obterCredenciaisBasic(cabecalhoAutorizacao);

  if (!credenciais) {
    return false;
  }

  return compararValorSensivel(credenciais.usuario, usuarioEsperado)
    && compararValorSensivel(credenciais.senha, senhaEsperada);
}

/**
 * Mantém o webhook inbound de e-mail explicitamente inativo
 * até a etapa futura de persistência e criação automática de chamados.
 */
export function controllerWebhookEmailPostmark(): NextResponse {
  const env = obterEnv();

  if (env.EMAIL_ENTRADA_HABILITADA !== "true") {
    return NextResponse.json({
      sucesso: false,
      mensagem: "A entrada de chamados por e-mail ainda não está habilitada.",
    }, { status: 503 });
  }

  return NextResponse.json({
    sucesso: false,
    mensagem: "A integração de entrada por e-mail está preparada, mas ainda não foi ativada.",
  }, { status: 501 });
}
