import { mapearErrosZod } from "../../lib/respostas";
import { ORIGENS_CHAMADO, type OrigemChamadoValor } from "../../types/dominio";
import type { ResultadoAcao } from "../../types/resultado";
import type { ResultadoResolucaoIntencao, IntencaoConfigurada } from "../../types/intencao";
import { obterSetorTriagemObrigatorio } from "../setores/servico_setor";
import {
  atualizarIntencao,
  criarIntencao,
  listarIntencoes,
  listarIntencoesAtivas,
} from "./repositorio_intencao";
import { schemaAtualizacaoIntencao, schemaCriacaoIntencao, schemaMensagemIntentSolver } from "./schema_intencao";
import { resolverIntencao } from "./resolver_intencao";

function ehOrigemChamado(valor: string): valor is OrigemChamadoValor {
  return ORIGENS_CHAMADO.includes(valor as OrigemChamadoValor);
}

function normalizarCanaisIntencao(canais: string[] | null | undefined): OrigemChamadoValor[] {
  const canaisValidos = (canais ?? []).filter(ehOrigemChamado);

  return canaisValidos.length > 0 ? canaisValidos : [...ORIGENS_CHAMADO];
}

function mapearIntencaoConfigurada(intencao: Awaited<ReturnType<typeof listarIntencoesAtivas>>[number]): IntencaoConfigurada {
  return {
    id: intencao.id,
    nome: intencao.nome,
    slug: intencao.slug,
    descricao: intencao.descricao,
    assuntoSugerido: intencao.assuntoSugerido,
    palavrasChave: intencao.palavrasChave,
    exemplos: intencao.exemplos,
    canais: normalizarCanaisIntencao(intencao.canais),
    prioridadeSugerida: intencao.prioridadeSugerida,
    confiancaMinima: intencao.confiancaMinima,
    ativo: intencao.ativo,
    setor: {
      id: intencao.setor.id,
      nome: intencao.setor.nome,
      descricao: intencao.setor.descricao,
      ehTriagem: intencao.setor.ehTriagem,
    },
  };
}

/**
 * Analisa uma mensagem usando as intenções ativas do banco.
 */
export async function analisarMensagemIntentSolver(
  mensagem: string,
  origem?: OrigemChamadoValor,
): Promise<ResultadoAcao<ResultadoResolucaoIntencao>> {
  const validacao = schemaMensagemIntentSolver.safeParse({ mensagem, origem });

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Mensagem inválida.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const intencoes = await listarIntencoesAtivas();
  const setorTriagem = await obterSetorTriagemObrigatorio();

  const origemAnalise = validacao.data.origem ?? "MANUAL";
  const intencoesDoCanal = intencoes
    .map(mapearIntencaoConfigurada)
    .filter((intencao) => intencao.canais.includes(origemAnalise));

  const resultado = resolverIntencao({
    mensagem: validacao.data.mensagem,
    intencoes: intencoesDoCanal,
    setorTriagem: {
      id: setorTriagem.id,
      nome: setorTriagem.nome,
      descricao: setorTriagem.descricao,
      ehTriagem: setorTriagem.ehTriagem,
    },
  });

  return { sucesso: true, dados: resultado };
}

/**
 * Lista intenções para administração.
 */
export async function obterIntencoes(ativo?: boolean) {
  return listarIntencoes(ativo);
}

/**
 * Cria intenção após validação de dados.
 */
export async function salvarNovaIntencao(
  dados: unknown,
): Promise<ResultadoAcao<{ id: string }>> {
  const validacao = schemaCriacaoIntencao.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const intencao = await criarIntencao(validacao.data);

  return { sucesso: true, dados: { id: intencao.id } };
}

/**
 * Atualiza intenção existente após validação parcial.
 */
export async function salvarAtualizacaoIntencao(
  id: string,
  dados: unknown,
): Promise<ResultadoAcao<{ id: string }>> {
  const validacao = schemaAtualizacaoIntencao.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  const intencao = await atualizarIntencao(id, validacao.data);

  return { sucesso: true, dados: { id: intencao.id } };
}
