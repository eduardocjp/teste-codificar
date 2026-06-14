import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { obterIntencoes, salvarAtualizacaoIntencao, salvarNovaIntencao } from "../modules/intents/servico_intencao";
import { excluirIntencao } from "../modules/intents/repositorio_intencao";
import { logError } from "../utils/logger";

/**
 * Lista intenções configuradas.
 */
export async function controllerListarIntencoes(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const ativoParam = request.nextUrl.searchParams.get("ativo");
    const ativo = ativoParam === null ? undefined : ativoParam === "true";
    const intencoes = await obterIntencoes(ativo);

    return NextResponse.json({ sucesso: true, dados: intencoes });
  } catch (erro) {
    logError("controllerListarIntencoes", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível listar intenções." }, { status: 500 });
  }
}

/**
 * Cria uma nova intenção.
 */
export async function controllerCriarIntencao(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await salvarNovaIntencao(body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 201 : 400 });
  } catch (erro) {
    logError("controllerCriarIntencao", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível criar a intenção." }, { status: 500 });
  }
}

/**
 * Atualiza intenção existente.
 */
export async function controllerAtualizarIntencao(
  request: NextRequest,
  id: string,
): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await salvarAtualizacaoIntencao(id, body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerAtualizarIntencao", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível atualizar a intenção." }, { status: 500 });
  }
}

/**
 * Exclui intenção configurada preservando chamados existentes.
 */
export async function controllerExcluirIntencao(id: string): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const intencao = await excluirIntencao(id);
    return NextResponse.json({ sucesso: true, dados: { id: intencao.id } });
  } catch (erro) {
    logError("controllerExcluirIntencao", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível excluir a intenção." }, { status: 500 });
  }
}
