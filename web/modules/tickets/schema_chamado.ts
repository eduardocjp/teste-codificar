import { z } from "zod";

import { ORIGENS_CHAMADO, PRIORIDADES, STATUS_CHAMADO } from "../../types/dominio";

const uuidOpcional = z
  .string()
  .uuid()
  .nullable()
  .optional()
  .transform((valor) => valor ?? undefined);

const uuidNullableOpcional = z.string().uuid().nullable().optional();

export const schemaCriacaoChamado = z.object({
  titulo: z.string().trim().min(5, "O título deve ter ao menos 5 caracteres."),
  descricao: z.string().trim().min(10, "A descrição deve ter ao menos 10 caracteres."),
  prioridade: z.enum(PRIORIDADES).default("MEDIA"),
  status: z.enum(STATUS_CHAMADO).default("ABERTO"),
  setorId: z.string().uuid("Setor inválido."),
  responsavelId: uuidOpcional,
  atribuicaoAutomatica: z.boolean().default(false),
  intencaoId: uuidOpcional,
  assunto: z.string().trim().optional().nullable(),
  confiancaIntencao: z.number().min(0).max(1).optional().nullable(),
  origem: z.enum(ORIGENS_CHAMADO).default("MANUAL"),
});

export const schemaAtualizacaoChamado = z.object({
  titulo: z.string().trim().min(5, "O título deve ter ao menos 5 caracteres.").optional(),
  descricao: z.string().trim().min(10, "A descrição deve ter ao menos 10 caracteres.").optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  status: z.enum(STATUS_CHAMADO).optional(),
  setorId: z.string().uuid("Setor inválido.").optional(),
  responsavelId: uuidNullableOpcional,
  intencaoId: uuidNullableOpcional,
  assunto: z.string().trim().optional().nullable(),
  confiancaIntencao: z.number().min(0).max(1).optional().nullable(),
  origem: z.enum(ORIGENS_CHAMADO).optional(),
});

export const schemaFiltrosChamado = z.object({
  status: z.enum(STATUS_CHAMADO).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  setorId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  origem: z.enum(ORIGENS_CHAMADO).optional(),
  busca: z.string().trim().optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
  ordenarPor: z.enum(["recentes", "antigos", "prioridade", "status", "titulo"]).default("recentes"),
});

export type DadosCriacaoChamado = z.infer<typeof schemaCriacaoChamado>;
export type DadosAtualizacaoChamado = z.infer<typeof schemaAtualizacaoChamado>;
export type DadosFiltroChamado = z.infer<typeof schemaFiltrosChamado>;
