import { NextResponse, type NextRequest } from "next/server";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import {
  atualizarResponsavel,
  criarResponsavel,
  excluirResponsavel,
  listarResponsaveis,
} from "../modules/responsaveis/servico_responsavel";
import { logError } from "../utils/logger";

/**
 * Lista atendentes ativos para atribuição de chamados.
 */
export async function controllerListarResponsaveis(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const setorId = request.nextUrl.searchParams.get("setorId") ?? undefined;
    const responsaveis = await listarResponsaveis(setorId);

    return NextResponse.json({ sucesso: true, dados: responsaveis });
  } catch (erro) {
    logError("controllerListarResponsaveis", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível listar responsáveis." }, { status: 500 });
  }
}

/**
 * Cria atendente ou administrador pela área administrativa.
 */
export async function controllerCriarResponsavel(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await criarResponsavel(body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 201 : 400 });
  } catch (erro) {
    logError("controllerCriarResponsavel", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível criar o atendente." }, { status: 500 });
  }
}

/**
 * Atualiza um atendente pela área administrativa.
 */
export async function controllerAtualizarResponsavel(request: NextRequest, id: string): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await atualizarResponsavel(id, body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerAtualizarResponsavel", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível atualizar o atendente." }, { status: 500 });
  }
}

/**
 * Exclui um atendente pela área administrativa.
 */
export async function controllerExcluirResponsavel(id: string): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva(["ADMINISTRADOR"]);

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 403 });
  }

  try {
    const resultado = await excluirResponsavel(id);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerExcluirResponsavel", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível excluir o atendente." }, { status: 500 });
  }
}
