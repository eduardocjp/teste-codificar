import { describe, expect, it } from "vitest";

import { schemaCriacaoChamado } from "../web/modules/tickets/schema_chamado";

const dadosValidos = {
  titulo: "Notebook não liga",
  descricao: "O notebook do financeiro não liga desde cedo.",
  prioridade: "ALTA",
  status: "ABERTO",
  setorId: "11111111-1111-1111-8111-111111111111",
  origem: "MANUAL",
} as const;

describe("schemaCriacaoChamado", () => {
  it("aceita chamado com campos obrigatórios", () => {
    const resultado = schemaCriacaoChamado.safeParse(dadosValidos);

    expect(resultado.success).toBe(true);
  });

  it("rejeita título curto", () => {
    const resultado = schemaCriacaoChamado.safeParse({ ...dadosValidos, titulo: "Erro" });

    expect(resultado.success).toBe(false);
  });

  it("rejeita descrição curta", () => {
    const resultado = schemaCriacaoChamado.safeParse({ ...dadosValidos, descricao: "Curta" });

    expect(resultado.success).toBe(false);
  });
});
