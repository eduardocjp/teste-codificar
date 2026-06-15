import { describe, expect, it, vi } from "vitest";

vi.mock("../web/lib/prisma", () => ({ prisma: {} }));

import { ordenarResponsaveisPorCarga } from "../web/services/servico_distribuicao";

describe("ordenarResponsaveisPorCarga", () => {
  it("seleciona o responsável com menor quantidade de chamados ativos", () => {
    const ordenados = ordenarResponsaveisPorCarga([
      { id: "b", cargaAtiva: 4, ultimaAtribuicao: null },
      { id: "a", cargaAtiva: 1, ultimaAtribuicao: null },
    ]);

    expect(ordenados[0].id).toBe("a");
  });

  it("prioriza quem nunca recebeu atribuição em empate", () => {
    const ordenados = ordenarResponsaveisPorCarga([
      { id: "b", cargaAtiva: 2, ultimaAtribuicao: new Date("2026-01-01T10:00:00Z") },
      { id: "a", cargaAtiva: 2, ultimaAtribuicao: null },
    ]);

    expect(ordenados[0].id).toBe("a");
  });

  it("aplica desempate por última atribuição mais antiga", () => {
    const ordenados = ordenarResponsaveisPorCarga([
      { id: "b", cargaAtiva: 2, ultimaAtribuicao: new Date("2026-01-02T10:00:00Z") },
      { id: "a", cargaAtiva: 2, ultimaAtribuicao: new Date("2026-01-01T10:00:00Z") },
    ]);

    expect(ordenados[0].id).toBe("a");
  });

  it("usa menor identificador quando carga e datas empatam", () => {
    const data = new Date("2026-01-01T10:00:00Z");
    const ordenados = ordenarResponsaveisPorCarga([
      { id: "b", cargaAtiva: 2, ultimaAtribuicao: data },
      { id: "a", cargaAtiva: 2, ultimaAtribuicao: data },
    ]);

    expect(ordenados[0].id).toBe("a");
  });
});
