import { prisma } from "../../lib/prisma";
import { gerarHashSenha } from "../../lib/seguranca";
import { buscarSetorAtivoPorId } from "../setores/repositorio_setor";
import { listarResponsaveisAtivos, buscarResponsavelPorId } from "./repositorio_responsavel";
import { schemaCriacaoResponsavel } from "./schema_responsavel";
import { mapearErrosZod } from "../../lib/respostas";
import type { ResultadoAcao } from "../../types/resultado";

/**
 * Lista atendentes aptos a receber chamados.
 */
export async function listarResponsaveis(setorId?: string) {
  return listarResponsaveisAtivos(setorId);
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
}
