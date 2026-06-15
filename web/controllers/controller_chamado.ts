import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { validarSessaoAtiva } from "../lib/auth";
import { lerJsonSeguro } from "../lib/respostas";
import { atribuirChamadoAutomaticamente } from "../services/servico_distribuicao";
import { buscarChamadoPorId } from "../modules/tickets/repositorio_chamado";
import {
  criarChamadoComDistribuicao,
  obterChamados,
  salvarAtualizacaoChamado,
} from "../modules/tickets/servico_chamado";
import { logError } from "../utils/logger";

const schemaDistribuicao = z.object({
  chamadoId: z.string().uuid(),
  setorId: z.string().uuid(),
});

/**
 * Lista chamados com filtros da URL.
 */
export async function controllerListarChamados(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const dados = await obterChamados(request.nextUrl.searchParams, sessao.dados);
    return NextResponse.json({ sucesso: true, dados });
  } catch (erro) {
    logError("controllerListarChamados", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível listar chamados." }, { status: 500 });
  }
}

/**
 * Cria chamado manual.
 */
export async function controllerCriarChamado(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await criarChamadoComDistribuicao(body);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 201 : 400 });
  } catch (erro) {
    logError("controllerCriarChamado", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível criar o chamado." }, { status: 500 });
  }
}

/**
 * Retorna detalhe de um chamado.
 */
export async function controllerBuscarChamado(id: string): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const chamado = await buscarChamadoPorId(id, sessao.dados);

    if (!chamado) {
      return NextResponse.json({ sucesso: false, mensagem: "Chamado não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ sucesso: true, dados: chamado });
  } catch (erro) {
    logError("controllerBuscarChamado", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível buscar o chamado." }, { status: 500 });
  }
}

/**
 * Atualiza um chamado existente.
 */
export async function controllerAtualizarChamado(
  request: NextRequest,
  id: string,
): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const resultado = await salvarAtualizacaoChamado(id, body, sessao.dados);

    return NextResponse.json(resultado, { status: resultado.sucesso ? 200 : 400 });
  } catch (erro) {
    logError("controllerAtualizarChamado", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível atualizar o chamado." }, { status: 500 });
  }
}

/**
 * Executa distribuição automática para um chamado existente.
 */
export async function controllerDistribuicao(request: NextRequest): Promise<NextResponse> {
  const sessao = await validarSessaoAtiva();

  if (!sessao.sucesso) {
    return NextResponse.json(sessao, { status: 401 });
  }

  try {
    const body = await lerJsonSeguro(request);
    const validacao = schemaDistribuicao.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json({ sucesso: false, mensagem: "Dados inválidos." }, { status: 400 });
    }

    const responsavel = await atribuirChamadoAutomaticamente(validacao.data.chamadoId, validacao.data.setorId);

    if (!responsavel) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Nenhum atendente ativo foi encontrado para este setor." },
        { status: 404 },
      );
    }

    return NextResponse.json({ sucesso: true, dados: { responsavel } });
  } catch (erro) {
    logError("controllerDistribuicao", erro);
    return NextResponse.json({ sucesso: false, mensagem: "Não foi possível distribuir o chamado." }, { status: 500 });
  }
}
