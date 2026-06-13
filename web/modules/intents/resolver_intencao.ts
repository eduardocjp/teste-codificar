import Fuse from "fuse.js";

import { limitarTexto, normalizarTexto } from "../../utils/utils";
import type { IntencaoConfigurada, ResultadoResolucaoIntencao } from "../../types/intencao";
import type { SetorResumo } from "../../types/setor";

type EntradaResolucaoIntencao = {
  mensagem: string;
  intencoes: IntencaoConfigurada[];
  setorTriagem: SetorResumo;
};

type CandidatoIntencao = {
  intencao: IntencaoConfigurada;
  confianca: number;
  termosEncontrados: string[];
};

function calcularPontuacaoPalavras(mensagemNormalizada: string, palavras: string[]): {
  pontuacao: number;
  termosEncontrados: string[];
} {
  if (palavras.length === 0) {
    return { pontuacao: 0, termosEncontrados: [] };
  }

  const tokensMensagem = mensagemNormalizada.split(" ").filter(Boolean);
  const fuseTokens = new Fuse(tokensMensagem, {
    includeScore: true,
    threshold: 0.32,
    ignoreLocation: true,
  });

  let pontos = 0;
  const encontrados = new Set<string>();

  for (const palavra of palavras) {
    const termo = normalizarTexto(palavra);

    if (!termo) {
      continue;
    }

    if (mensagemNormalizada.includes(termo)) {
      pontos += 1;
      encontrados.add(palavra);
      continue;
    }

    const melhor = fuseTokens.search(termo)[0];

    if (melhor?.score !== undefined && melhor.score <= 0.32) {
      pontos += 0.65;
      encontrados.add(palavra);
    }
  }

  return {
    pontuacao: pontos > 0 ? Math.min(Math.max(pontos / palavras.length, 0.6), 1) : 0,
    termosEncontrados: [...encontrados],
  };
}

function calcularPontuacaoExemplos(mensagemNormalizada: string, exemplos: string[]): number {
  if (exemplos.length === 0) {
    return 0;
  }

  const exemplosNormalizados = exemplos.map((exemplo) => ({
    original: exemplo,
    normalizado: normalizarTexto(exemplo),
  }));

  const fuse = new Fuse(exemplosNormalizados, {
    keys: ["normalizado"],
    includeScore: true,
    threshold: 0.55,
    ignoreLocation: true,
  });

  const resultado = fuse.search(mensagemNormalizada)[0];

  if (!resultado || resultado.score === undefined) {
    return 0;
  }

  return Math.max(0, 1 - resultado.score);
}

function criarResultadoFallback(mensagem: string, setorTriagem: SetorResumo): ResultadoResolucaoIntencao {
  const titulo = limitarTexto(mensagem.trim() || "Solicitação geral", 80);

  return {
    identificada: false,
    intencaoId: null,
    nomeIntencao: null,
    assuntoSugerido: "Solicitação geral",
    tituloSugerido: titulo,
    setorId: setorTriagem.id,
    setorNome: setorTriagem.nome,
    prioridadeSugerida: "MEDIA",
    confianca: 0,
    termosEncontrados: [],
  };
}

function criarResultadoIdentificado(
  mensagem: string,
  candidato: CandidatoIntencao,
): ResultadoResolucaoIntencao {
  return {
    identificada: true,
    intencaoId: candidato.intencao.id,
    nomeIntencao: candidato.intencao.nome,
    assuntoSugerido: candidato.intencao.assuntoSugerido,
    tituloSugerido: limitarTexto(candidato.intencao.assuntoSugerido || mensagem, 80),
    setorId: candidato.intencao.setor.id,
    setorNome: candidato.intencao.setor.nome,
    prioridadeSugerida: candidato.intencao.prioridadeSugerida,
    confianca: candidato.confianca,
    termosEncontrados: candidato.termosEncontrados,
  };
}

/**
 * Resolve a intenção mais provável combinando palavras-chave e exemplos.
 */
export function resolverIntencao({
  mensagem,
  intencoes,
  setorTriagem,
}: EntradaResolucaoIntencao): ResultadoResolucaoIntencao {
  const mensagemNormalizada = normalizarTexto(mensagem);

  if (!mensagemNormalizada) {
    return criarResultadoFallback(mensagem, setorTriagem);
  }

  const candidatos: CandidatoIntencao[] = intencoes
    .filter((intencao) => intencao.ativo)
    .map((intencao) => {
      const palavras = calcularPontuacaoPalavras(mensagemNormalizada, intencao.palavrasChave);
      const exemplos = calcularPontuacaoExemplos(mensagemNormalizada, intencao.exemplos);
      const confianca = Number(((palavras.pontuacao * 0.7 + exemplos * 0.3) || 0).toFixed(4));

      return {
        intencao,
        confianca,
        termosEncontrados: palavras.termosEncontrados,
      };
    })
    .filter((candidato) => candidato.confianca >= candidato.intencao.confiancaMinima)
    .sort((a, b) => {
      if (b.confianca !== a.confianca) {
        return b.confianca - a.confianca;
      }

      return a.intencao.id.localeCompare(b.intencao.id);
    });

  const melhor = candidatos[0];

  if (!melhor) {
    return criarResultadoFallback(mensagem, setorTriagem);
  }

  return criarResultadoIdentificado(mensagem, melhor);
}
