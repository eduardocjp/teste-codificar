import { describe, expect, it } from "vitest";

import { cn, formatarDataHora, limitarTexto, normalizarTexto } from "../web/utils/utils";

describe("utils", () => {
  it("cn mescla classes e resolve conflitos do Tailwind", () => {
    expect(cn("px-2", false, "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("normalizarTexto remove acentos, pontuação e espaços duplicados", () => {
    expect(normalizarTexto("  Impressão: NÃO funciona!!!  ")).toBe("impressao nao funciona");
  });

  it("limitarTexto preserva textos menores que o limite", () => {
    expect(limitarTexto("texto curto", 20)).toBe("texto curto");
  });

  it("limitarTexto corta preferencialmente em uma palavra", () => {
    expect(limitarTexto("solicitação muito grande para o título", 20)).toBe("solicitação muito...");
  });

  it("limitarTexto corta diretamente quando não há espaço útil", () => {
    expect(limitarTexto("abcdefghijklmnopqrstuvwxyz", 10)).toBe("abcdefghij...");
  });

  it("formatarDataHora retorna data e horário em pt-BR", () => {
    const resultado = formatarDataHora("2026-01-02T03:04:00");

    expect(resultado).toContain("02/01/2026");
    expect(resultado).toContain("03:04");
  });
});
