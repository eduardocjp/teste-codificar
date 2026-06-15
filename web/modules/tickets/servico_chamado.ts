import { mapearErrosZod } from "../../lib/respostas";
import type { ResultadoAcao } from "../../types/resultado";
import type { ChamadoComRelacoes } from "../../types/chamado";
import { buscarSetorAtivoPorId } from "../setores/repositorio_setor";
import { validarResponsavelParaSetor } from "../responsaveis/servico_responsavel";
import {
  registrarUltimaAtribuicaoResponsavel,
  selecionarResponsavelAutomaticamente,
} from "../../services/servico_distribuicao";
import {
  atualizarChamado,
  buscarChamadoPorId,
  criarChamado,
  listarChamados,
} from "./repositorio_chamado";
import { schemaAtualizacaoChamado, schemaCriacaoChamado, schemaFiltrosChamado } from "./schema_chamado";
import type { DadosAtualizacaoChamadoPersistencia } from "./repositorio_chamado";
import type { SessaoUsuario } from "../../types/usuario";

/**
 * Lista chamados respeitando filtros e permissões do usuário autenticado.
 */
export async function obterChamados(searchParams: URLSearchParams, sessao: SessaoUsuario) {
  const dados = Object.fromEntries(searchParams.entries());
  const validacao = schemaFiltrosChamado.safeParse(dados);
  const filtros = validacao.success ? validacao.data : schemaFiltrosChamado.parse({});

  return listarChamados(filtros, sessao);
}

async function validarBaseChamado(dados: {
  setorId: string;
  responsavelId?: string | null;
}): Promise<ResultadoAcao<true>> {
  const setor = await buscarSetorAtivoPorId(dados.setorId);

  if (!setor) {
    return { sucesso: false, mensagem: "Setor inválido." };
  }

  if (dados.responsavelId) {
    const responsavel = await validarResponsavelParaSetor(dados.responsavelId, dados.setorId);

    if (!responsavel.sucesso) {
      return { sucesso: false, mensagem: responsavel.mensagem, errosCampos: responsavel.errosCampos };
    }
  }

  return { sucesso: true, dados: true };
}

/**
 * Cria chamado com atribuição manual ou automática.
 */
export async function criarChamadoComDistribuicao(
  dados: unknown,
): Promise<ResultadoAcao<ChamadoComRelacoes>> {
  const validacao = schemaCriacaoChamado.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Não foi possível criar o chamado.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const base = await validarBaseChamado(validacao.data);

  if (!base.sucesso) {
    return base;
  }

  if (validacao.data.atribuicaoAutomatica) {
    const responsavel = await selecionarResponsavelAutomaticamente(validacao.data.setorId);

    const chamado = await criarChamado({
      ...validacao.data,
      responsavelId: responsavel?.id,
    });

    if (responsavel) {
      await registrarUltimaAtribuicaoResponsavel(responsavel.id);
    }

    return { sucesso: true, dados: chamado };
  }

  const chamado = await criarChamado(validacao.data);

  return { sucesso: true, dados: chamado };
}

function aplicarDatasStatus(dados: DadosAtualizacaoChamadoPersistencia): DadosAtualizacaoChamadoPersistencia {
  if (!dados.status) {
    return dados;
  }

  if (dados.status === "RESOLVIDO") {
    return { ...dados, dataResolucao: new Date(), dataFechamento: null };
  }

  if (dados.status === "FECHADO") {
    return { ...dados, dataFechamento: new Date() };
  }

  return { ...dados, dataResolucao: null, dataFechamento: null };
}

/**
 * Atualiza chamado validando setor, responsável e datas de status.
 */
export async function salvarAtualizacaoChamado(
  id: string,
  dados: unknown,
): Promise<ResultadoAcao<ChamadoComRelacoes>> {
  const validacao = schemaAtualizacaoChamado.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Não foi possível atualizar o chamado.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const atual = await buscarChamadoPorId(id);

  if (!atual) {
    return { sucesso: false, mensagem: "Chamado não encontrado." };
  }

  const setorId = validacao.data.setorId ?? atual.setorId;
  const responsavelId = validacao.data.responsavelId;
  const base = await validarBaseChamado({ setorId, responsavelId });

  if (!base.sucesso) {
    return base;
  }

  const atualizado = await atualizarChamado(id, aplicarDatasStatus(validacao.data));

  return { sucesso: true, dados: atualizado };
}
