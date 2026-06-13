import { describe, expect, it } from "vitest";

import { resolverIntencao } from "../web/modules/intents/resolver_intencao";
import type { IntencaoConfigurada } from "../web/types/intencao";
import type { SetorResumo } from "../web/types/setor";

const setorTi: SetorResumo = {
  id: "11111111-1111-1111-1111-111111111111",
  nome: "Tecnologia da Informação",
  descricao: null,
  ehTriagem: false,
};

const setorInfra: SetorResumo = {
  id: "22222222-2222-2222-2222-222222222222",
  nome: "Infraestrutura",
  descricao: null,
  ehTriagem: false,
};

const setorTriagem: SetorResumo = {
  id: "33333333-3333-3333-3333-333333333333",
  nome: "Triagem",
  descricao: null,
  ehTriagem: true,
};

const intencoes: IntencaoConfigurada[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    nome: "Problema com computador",
    slug: "problema-computador",
    descricao: null,
    assuntoSugerido: "Computador com defeito ou lentidão",
    palavrasChave: ["computador", "notebook", "travou", "lento"],
    exemplos: ["meu computador travou", "o notebook está muito lento"],
    prioridadeSugerida: "ALTA",
    confiancaMinima: 0.4,
    ativo: true,
    setor: setorTi,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    nome: "Problema com impressora",
    slug: "problema-impressora",
    descricao: null,
    assuntoSugerido: "Impressora com defeito",
    palavrasChave: ["impressora", "imprimir", "toner", "papel"],
    exemplos: ["a impressora não está funcionando", "não consigo imprimir"],
    prioridadeSugerida: "MEDIA",
    confiancaMinima: 0.4,
    ativo: true,
    setor: setorTi,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    nome: "Solicitação de mobiliário",
    slug: "solicitacao-mobiliario",
    descricao: null,
    assuntoSugerido: "Necessidade de móvel ou equipamento de escritório",
    palavrasChave: ["cadeira", "mesa", "mobiliário"],
    exemplos: ["preciso de uma cadeira nova"],
    prioridadeSugerida: "BAIXA",
    confiancaMinima: 0.4,
    ativo: true,
    setor: setorInfra,
  },
];

describe("resolverIntencao", () => {
  it("identifica problema com computador por palavras-chave", () => {
    const resultado = resolverIntencao({
      mensagem: "Meu computador travou e está lento",
      intencoes,
      setorTriagem,
    });

    expect(resultado.identificada).toBe(true);
    expect(resultado.nomeIntencao).toBe("Problema com computador");
    expect(resultado.prioridadeSugerida).toBe("ALTA");
  });

  it("identifica problema com impressora por exemplo similar", () => {
    const resultado = resolverIntencao({
      mensagem: "Não estou conseguindo imprimir no financeiro",
      intencoes,
      setorTriagem,
    });

    expect(resultado.nomeIntencao).toBe("Problema com impressora");
  });

  it("lida com acentuação e maiúsculas", () => {
    const resultado = resolverIntencao({
      mensagem: "Preciso de MOBILIARIO para uma sala nova",
      intencoes,
      setorTriagem,
    });

    expect(resultado.nomeIntencao).toBe("Solicitação de mobiliário");
  });

  it("retorna fallback quando confiança é insuficiente", () => {
    const resultado = resolverIntencao({
      mensagem: "pedido genérico sem contexto suficiente",
      intencoes,
      setorTriagem,
    });

    expect(resultado.identificada).toBe(false);
    expect(resultado.setorId).toBe(setorTriagem.id);
    expect(resultado.prioridadeSugerida).toBe("MEDIA");
  });

  it("ignora intenções inativas", () => {
    const resultado = resolverIntencao({
      mensagem: "computador travou",
      intencoes: [{ ...intencoes[0], ativo: false }],
      setorTriagem,
    });

    expect(resultado.identificada).toBe(false);
  });
});
