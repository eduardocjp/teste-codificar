import { describe, expect, it } from "vitest";

import {
  schemaAtualizacaoIntencao,
  schemaCriacaoIntencao,
  schemaMensagemIntentSolver,
} from "../web/modules/intents/schema_intencao";
import {
  schemaAtualizacaoResponsavel,
  schemaCriacaoResponsavel,
} from "../web/modules/responsaveis/schema_responsavel";
import {
  schemaAtualizacaoChamado,
  schemaCriacaoChamado,
  schemaFiltrosChamado,
} from "../web/modules/tickets/schema_chamado";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("schemas de chamado", () => {
  it("schemaCriacaoChamado aplica defaults", () => {
    const resultado = schemaCriacaoChamado.parse({
      titulo: "Notebook não liga",
      descricao: "O notebook do financeiro não liga desde cedo.",
      setorId: uuid,
    });

    expect(resultado.prioridade).toBe("MEDIA");
    expect(resultado.status).toBe("ABERTO");
    expect(resultado.origem).toBe("MANUAL");
    expect(resultado.atribuicaoAutomatica).toBe(false);
  });

  it("schemaAtualizacaoChamado aceita atualização parcial", () => {
    expect(schemaAtualizacaoChamado.parse({ status: "FECHADO" })).toEqual({ status: "FECHADO" });
  });

  it("schemaFiltrosChamado aplica paginação padrão", () => {
    expect(schemaFiltrosChamado.parse({})).toMatchObject({
      pagina: 1,
      limite: 20,
      ordenarPor: "recentes",
    });
  });

  it("schemaFiltrosChamado rejeita limite excessivo", () => {
    expect(schemaFiltrosChamado.safeParse({ limite: 500 }).success).toBe(false);
  });
});

describe("schemas de intenção", () => {
  it("schemaMensagemIntentSolver exige mensagem mínima", () => {
    expect(schemaMensagemIntentSolver.safeParse({ mensagem: "abc" }).success).toBe(false);
    expect(schemaMensagemIntentSolver.safeParse({ mensagem: "impressora sem toner" }).success).toBe(true);
  });

  it("schemaCriacaoIntencao valida slug, palavras e defaults", () => {
    const resultado = schemaCriacaoIntencao.parse({
      nome: "Problema com rede",
      slug: "problema-rede",
      assuntoSugerido: "Sem conexão",
      palavrasChave: ["internet"],
      setorId: uuid,
    });

    expect(resultado.prioridadeSugerida).toBe("MEDIA");
    expect(resultado.confiancaMinima).toBe(0.55);
    expect(resultado.ativo).toBe(true);
  });

  it("schemaCriacaoIntencao rejeita slug inválido", () => {
    expect(
      schemaCriacaoIntencao.safeParse({
        nome: "Problema",
        slug: "Problema Rede",
        assuntoSugerido: "Sem conexão",
        palavrasChave: ["internet"],
        setorId: uuid,
      }).success,
    ).toBe(false);
  });

  it("schemaAtualizacaoIntencao aceita atualização parcial", () => {
    expect(schemaAtualizacaoIntencao.parse({ ativo: false })).toEqual({ ativo: false });
  });
});

describe("schema de responsável", () => {
  it("normaliza e-mail e aplica perfil padrão", () => {
    const resultado = schemaCriacaoResponsavel.parse({
      nome: "Ana Lima",
      email: "ANA@EMPRESA.COM",
      senha: "senha123",
      setorId: uuid,
    });

    expect(resultado.email).toBe("ana@empresa.com");
    expect(resultado.perfil).toBe("ATENDENTE");
    expect(resultado.ativo).toBe(true);
  });

  it("rejeita senha curta", () => {
    expect(
      schemaCriacaoResponsavel.safeParse({
        nome: "Ana Lima",
        email: "ana@empresa.com",
        senha: "123",
        setorId: uuid,
      }).success,
    ).toBe(false);
  });

  it("schemaAtualizacaoResponsavel aceita senha vazia como ausência de alteração", () => {
    expect(schemaAtualizacaoResponsavel.parse({ senha: "", ativo: false })).toEqual({
      senha: undefined,
      ativo: false,
    });
  });
});
