import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { obterDatabaseUrl, obterEnv } from "../web/lib/env";
import { lerJsonSeguro, mapearErrosZod } from "../web/lib/respostas";
import { logError, logInfo, logWarn } from "../web/utils/logger";

const envOriginal = { ...process.env };

afterEach(() => {
  process.env = { ...envOriginal };
  vi.restoreAllMocks();
});

describe("env", () => {
  it("obterEnv aplica valores padrão seguros", () => {
    delete process.env.SESSAO_NOME_COOKIE;
    delete process.env.SESSAO_DURACAO_HORAS;
    delete process.env.PROVEDOR_MENSAGENS;
    delete process.env.EVOLUTION_API_HABILITADA;

    const env = obterEnv();

    expect(env.SESSAO_NOME_COOKIE).toBe("sessao_chamados");
    expect(env.SESSAO_DURACAO_HORAS).toBe(8);
    expect(env.PROVEDOR_MENSAGENS).toBe("simulador");
    expect(env.EVOLUTION_API_HABILITADA).toBe("false");
  });

  it("obterDatabaseUrl prioriza DATABASE_URL configurada", () => {
    process.env.DATABASE_URL = "postgresql://usuario:senha@host:5432/app";

    expect(obterDatabaseUrl()).toBe("postgresql://usuario:senha@host:5432/app");
  });
});

describe("respostas", () => {
  it("mapearErrosZod agrupa mensagens por campo", () => {
    const schema = z.object({
      email: z.string().email("E-mail inválido."),
      nome: z.string().min(3, "Nome curto."),
    });
    const resultado = schema.safeParse({ email: "x", nome: "A" });

    expect(resultado.success).toBe(false);

    if (!resultado.success) {
      expect(mapearErrosZod(resultado.error)).toEqual({
        email: ["E-mail inválido."],
        nome: ["Nome curto."],
      });
    }
  });

  it("lerJsonSeguro retorna JSON válido", async () => {
    const request = new Request("http://local.test", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    });

    await expect(lerJsonSeguro(request)).resolves.toEqual({ ok: true });
  });

  it("lerJsonSeguro retorna null para JSON inválido", async () => {
    const request = new Request("http://local.test", {
      method: "POST",
      body: "{",
    });

    await expect(lerJsonSeguro(request)).resolves.toBeNull();
  });
});

describe("logger", () => {
  it("logInfo escreve payload informativo no stderr", () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logInfo("contexto", { id: 1 });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"nivel\":\"info\""));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"contexto\":\"contexto\""));
  });

  it("logWarn escreve payload de alerta no stderr", () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logWarn("contexto", { ativo: false });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"nivel\":\"warn\""));
  });

  it("logError serializa mensagem sem expor stack ao usuário", () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    logError("contexto", new Error("falha controlada"));

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"nivel\":\"error\""));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("falha controlada"));
  });
});
