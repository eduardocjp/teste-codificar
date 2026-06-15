import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  tentativaLogin: {
    findUnique: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../web/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  JANELA_TENTATIVAS_LOGIN_MS,
  registrarFalhaLogin,
  limparRateLimitLogin,
  verificarRateLimitLogin,
} from "../web/services/servico_rate_limit_login";

const envOriginal = { ...process.env };

function requestLogin(): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.10",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...envOriginal, VERCEL: "1" };
});

afterEach(() => {
  process.env = { ...envOriginal };
});

describe("servico_rate_limit_login", () => {
  it("permite login quando nao ha tentativas registradas", async () => {
    prismaMock.tentativaLogin.findUnique.mockResolvedValueOnce(null);

    await expect(verificarRateLimitLogin(requestLogin(), "admin@empresa.com")).resolves.toEqual({
      permitido: true,
      tentarNovamenteEm: null,
    });
  });

  it("registra falha usando hash sem persistir e-mail ou IP em claro", async () => {
    prismaMock.tentativaLogin.findUnique.mockResolvedValueOnce(null);

    await registrarFalhaLogin(requestLogin(), "admin@empresa.com", new Date("2026-06-15T10:00:00Z"));

    const chamada = prismaMock.tentativaLogin.upsert.mock.calls[0]?.[0] as {
      create: { identificadorHash: string; emailHash: string };
    };

    expect(chamada.create.identificadorHash).toHaveLength(64);
    expect(chamada.create.emailHash).toHaveLength(64);
    expect(chamada.create.identificadorHash).not.toContain("admin@empresa.com");
    expect(chamada.create.identificadorHash).not.toContain("203.0.113.10");
  });

  it("bloqueia na terceira falha dentro da janela de 60 segundos", async () => {
    const janelaInicio = new Date("2026-06-15T10:00:00Z");
    const agora = new Date(janelaInicio.getTime() + 20_000);

    prismaMock.tentativaLogin.findUnique.mockResolvedValueOnce({
      id: "tentativa",
      identificadorHash: "hash",
      emailHash: "email-hash",
      tentativas: 2,
      janelaInicio,
      bloqueadoAte: null,
    });

    const resultado = await registrarFalhaLogin(requestLogin(), "admin@empresa.com", agora);

    expect(resultado.tentarNovamenteEm?.getTime()).toBe(janelaInicio.getTime() + JANELA_TENTATIVAS_LOGIN_MS);
    expect(prismaMock.tentativaLogin.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tentativas: 3 }),
    }));
  });

  it("rejeita tentativa enquanto bloqueio esta ativo", async () => {
    const bloqueadoAte = new Date("2026-06-15T10:01:00Z");

    prismaMock.tentativaLogin.findUnique.mockResolvedValueOnce({
      id: "tentativa",
      identificadorHash: "hash",
      emailHash: "email-hash",
      tentativas: 3,
      janelaInicio: new Date("2026-06-15T10:00:00Z"),
      bloqueadoAte,
    });

    await expect(
      verificarRateLimitLogin(requestLogin(), "admin@empresa.com", new Date("2026-06-15T10:00:30Z")),
    ).resolves.toEqual({
      permitido: false,
      tentarNovamenteEm: bloqueadoAte,
    });
  });

  it("limpa tentativas quando login e concluido com sucesso", async () => {
    await limparRateLimitLogin(requestLogin(), "admin@empresa.com");

    expect(prismaMock.tentativaLogin.deleteMany).toHaveBeenCalledWith({
      where: { identificadorHash: expect.any(String) as string },
    });
  });
});
