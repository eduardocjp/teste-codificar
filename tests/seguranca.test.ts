import { describe, expect, it } from "vitest";

import { gerarHashSenha, gerarHashToken, gerarTokenSeguro, verificarSenha } from "../web/lib/seguranca";

describe("seguranca", () => {
  it("gera hash de senha verificável e não armazena texto puro", async () => {
    const hash = await gerarHashSenha("senha-segura");

    expect(hash).not.toBe("senha-segura");
    expect(hash).toContain(":");
    await expect(verificarSenha("senha-segura", hash)).resolves.toBe(true);
  });

  it("rejeita senha incorreta", async () => {
    const hash = await gerarHashSenha("senha-segura");

    await expect(verificarSenha("outra-senha", hash)).resolves.toBe(false);
  });

  it("rejeita hash inválido", async () => {
    await expect(verificarSenha("senha", "hash-invalido")).resolves.toBe(false);
  });

  it("gera tokens opacos diferentes", () => {
    const primeiro = gerarTokenSeguro();
    const segundo = gerarTokenSeguro();

    expect(primeiro).not.toBe(segundo);
    expect(primeiro.length).toBeGreaterThan(20);
  });

  it("gera hash SHA-256 estável para token", () => {
    expect(gerarHashToken("abc")).toBe(gerarHashToken("abc"));
    expect(gerarHashToken("abc")).not.toBe("abc");
    expect(gerarHashToken("abc")).toHaveLength(64);
  });
});
