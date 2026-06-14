import { prisma } from "../../lib/prisma";
import { gerarHashSenha } from "../../lib/seguranca";
import { buscarSetorAtivoPorId } from "../setores/repositorio_setor";
import {
  buscarResponsavelPorId,
  listarAtendentesAdministracao,
  listarResponsaveisAtivos,
} from "./repositorio_responsavel";
import { schemaAtualizacaoResponsavel, schemaCriacaoResponsavel } from "./schema_responsavel";
import { mapearErrosZod } from "../../lib/respostas";
import type { ResultadoAcao } from "../../types/resultado";

function erroPrismaComCodigo(erro: unknown, codigo: string): boolean {
  return typeof erro === "object" && erro !== null && "code" in erro && (erro as { code?: unknown }).code === codigo;
}

/**
 * Lista atendentes aptos a receber chamados.
 */
export async function listarResponsaveis(setorId?: string) {
  return listarResponsaveisAtivos(setorId);
}

/**
 * Lista atendentes ativos e inativos para a área administrativa.
 */
export async function listarAtendentesParaAdministracao() {
  return listarAtendentesAdministracao();
}

/**
 * Valida se o responsável pode receber chamado no setor informado.
 */
export async function validarResponsavelParaSetor(
  responsavelId: string,
  setorId: string,
): Promise<ResultadoAcao<{ id: string; nome: string }>> {
  const responsavel = await buscarResponsavelPorId(responsavelId);

  if (!responsavel) {
    return { sucesso: false, mensagem: "Responsável não encontrado." };
  }

  if (!responsavel.ativo || responsavel.perfil !== "ATENDENTE") {
    return { sucesso: false, mensagem: "Responsável inativo ou sem perfil de atendente." };
  }

  if (responsavel.setorId !== setorId) {
    return { sucesso: false, mensagem: "Responsável não pertence ao setor selecionado." };
  }

  return { sucesso: true, dados: { id: responsavel.id, nome: responsavel.nome } };
}

/**
 * Cria usuário atendente ou administrador pela área administrativa.
 */
export async function criarResponsavel(
  dados: unknown,
): Promise<ResultadoAcao<{ id: string }>> {
  const validacao = schemaCriacaoResponsavel.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  if (validacao.data.perfil === "ATENDENTE") {
    if (!validacao.data.setorId) {
      return { sucesso: false, mensagem: "Atendente precisa estar associado a um setor." };
    }

    const setor = await buscarSetorAtivoPorId(validacao.data.setorId);

    if (!setor) {
      return { sucesso: false, mensagem: "Setor inválido." };
    }
  }

  const senhaHash = await gerarHashSenha(validacao.data.senha);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nome: validacao.data.nome,
        email: validacao.data.email,
        senhaHash,
        perfil: validacao.data.perfil,
        ativo: validacao.data.ativo,
        setorId: validacao.data.perfil === "ATENDENTE" ? validacao.data.setorId ?? null : null,
      },
      select: { id: true },
    });

    return { sucesso: true, dados: usuario };
  } catch (erro) {
    if (erroPrismaComCodigo(erro, "P2002")) {
      return {
        sucesso: false,
        mensagem: "E-mail já cadastrado.",
        errosCampos: { email: ["E-mail já cadastrado."] },
      };
    }

    throw erro;
  }
}

/**
 * Atualiza dados de um atendente pela área administrativa.
 */
export async function atualizarResponsavel(
  id: string,
  dados: unknown,
): Promise<ResultadoAcao<{ id: string }>> {
  const validacao = schemaAtualizacaoResponsavel.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const responsavelAtual = await buscarResponsavelPorId(id);

  if (!responsavelAtual) {
    return { sucesso: false, mensagem: "Atendente não encontrado." };
  }

  if (responsavelAtual.perfil !== "ATENDENTE") {
    return { sucesso: false, mensagem: "Somente atendentes podem ser editados nesta área." };
  }

  const perfil = validacao.data.perfil ?? responsavelAtual.perfil;
  const setorId = validacao.data.setorId !== undefined ? validacao.data.setorId : responsavelAtual.setorId;

  if (perfil === "ATENDENTE") {
    if (!setorId) {
      return { sucesso: false, mensagem: "Atendente precisa estar associado a um setor." };
    }

    const setor = await buscarSetorAtivoPorId(setorId);

    if (!setor) {
      return { sucesso: false, mensagem: "Setor inválido." };
    }
  }

  const senhaHash = validacao.data.senha ? await gerarHashSenha(validacao.data.senha) : undefined;

  try {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nome: validacao.data.nome,
        email: validacao.data.email,
        senhaHash,
        perfil,
        ativo: validacao.data.ativo,
        setorId: perfil === "ATENDENTE" ? setorId : null,
      },
      select: { id: true },
    });

    return { sucesso: true, dados: usuario };
  } catch (erro) {
    if (erroPrismaComCodigo(erro, "P2002")) {
      return {
        sucesso: false,
        mensagem: "E-mail já cadastrado.",
        errosCampos: { email: ["E-mail já cadastrado."] },
      };
    }

    throw erro;
  }
}

/**
 * Exclui um atendente pela área administrativa.
 */
export async function excluirResponsavel(id: string): Promise<ResultadoAcao<{ id: string }>> {
  const responsavelAtual = await buscarResponsavelPorId(id);

  if (!responsavelAtual) {
    return { sucesso: false, mensagem: "Atendente não encontrado." };
  }

  if (responsavelAtual.perfil !== "ATENDENTE") {
    return { sucesso: false, mensagem: "Somente atendentes podem ser excluídos nesta área." };
  }

  const usuario = await prisma.usuario.delete({
    where: { id },
    select: { id: true },
  });

  return { sucesso: true, dados: usuario };
}
