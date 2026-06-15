import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  sessaoWhatsapp: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  conversa: {
    findMany: vi.fn(),
  },
}));

const loggerMock = vi.hoisted(() => ({
  logInfo: vi.fn(),
}));

vi.mock("../web/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../web/utils/logger", () => loggerMock);

import {
  finalizarConversaWhatsapp,
  listarConversasAtendimento,
} from "../web/services/servico_conversa";
import type { SessaoUsuario } from "../web/types/usuario";

const sessaoAdmin: SessaoUsuario = {
  id: "admin-id",
  nome: "Admin",
  email: "admin@empresa.com",
  perfil: "ADMINISTRADOR",
  setorId: null,
  setorNome: null,
};

const sessaoAtendente: SessaoUsuario = {
  id: "atendente-id",
  nome: "Ana",
  email: "ana@empresa.com",
  perfil: "ATENDENTE",
  setorId: "setor-id",
  setorNome: "TI",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("servico_conversa", () => {
  it("listarConversasAtendimento filtra atendente por responsável ou setor", async () => {
    prismaMock.sessaoWhatsapp.findMany.mockResolvedValueOnce([]);
    prismaMock.conversa.findMany.mockResolvedValueOnce([]);

    await listarConversasAtendimento(sessaoAtendente);

    expect(prismaMock.sessaoWhatsapp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { chamado: { is: { responsavelId: "atendente-id" } } },
            { chamado: { is: { setorId: "setor-id" } } },
          ],
        },
      }),
    );
  });

  it("finalizarConversaWhatsapp rejeita atendente", async () => {
    await expect(finalizarConversaWhatsapp("sessao", sessaoAtendente)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Você não possui permissão.",
    });
  });

  it("finalizarConversaWhatsapp marca sessão aberta como finalizada", async () => {
    prismaMock.sessaoWhatsapp.findUnique.mockResolvedValueOnce({ id: "sessao", finalizadoEm: null });
    prismaMock.sessaoWhatsapp.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(finalizarConversaWhatsapp("sessao", sessaoAdmin)).resolves.toMatchObject({
      sucesso: true,
      dados: { id: "sessao" },
    });
    expect(prismaMock.sessaoWhatsapp.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sessao", finalizadoEm: null },
        data: expect.objectContaining({ estado: "EXPIRADA", finalizadoEm: expect.any(Date) }),
      }),
    );
  });

  it("finalizarConversaWhatsapp não finaliza sessão já finalizada", async () => {
    prismaMock.sessaoWhatsapp.findUnique.mockResolvedValueOnce({
      id: "sessao",
      finalizadoEm: new Date("2026-06-15T01:00:00Z"),
    });

    await expect(finalizarConversaWhatsapp("sessao", sessaoAdmin)).resolves.toMatchObject({
      sucesso: false,
      mensagem: "Conversa já finalizada.",
    });
    expect(prismaMock.sessaoWhatsapp.updateMany).not.toHaveBeenCalled();
  });
});
