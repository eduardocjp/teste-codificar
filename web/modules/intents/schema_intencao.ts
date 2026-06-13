import { z } from "zod";

import { ORIGENS_CHAMADO, PRIORIDADES } from "../../types/dominio";

export const CANAIS_PADRAO_INTENCAO = [...ORIGENS_CHAMADO];

export const schemaMensagemIntentSolver = z.object({
  origem: z.enum(ORIGENS_CHAMADO).optional(),
  mensagem: z.string().trim().min(5, "Informe uma solicitação com pelo menos 5 caracteres."),
});

export const schemaCriacaoIntencao = z.object({
  nome: z.string().trim().min(3, "Informe o nome da intenção."),
  slug: z
    .string()
    .trim()
    .min(3, "Informe o slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas minúsculas, números e hífen."),
  descricao: z.string().trim().optional().nullable(),
  assuntoSugerido: z.string().trim().min(5, "Informe o assunto sugerido."),
  palavrasChave: z.array(z.string().trim().min(2)).min(1, "Informe ao menos uma palavra-chave."),
  exemplos: z.array(z.string().trim().min(5)).default([]),
  canais: z.array(z.enum(ORIGENS_CHAMADO)).min(1, "Informe ao menos um canal.").default(CANAIS_PADRAO_INTENCAO),
  prioridadeSugerida: z.enum(PRIORIDADES).default("MEDIA"),
  confiancaMinima: z.number().min(0).max(1).default(0.55),
  ativo: z.boolean().default(true),
  setorId: z.string().uuid("Setor inválido."),
});

export const schemaAtualizacaoIntencao = z.object({
  nome: z.string().trim().min(3, "Informe o nome da intenção.").optional(),
  slug: z
    .string()
    .trim()
    .min(3, "Informe o slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas minúsculas, números e hífen.")
    .optional(),
  descricao: z.string().trim().optional().nullable(),
  assuntoSugerido: z.string().trim().min(5, "Informe o assunto sugerido.").optional(),
  palavrasChave: z.array(z.string().trim().min(2)).min(1, "Informe ao menos uma palavra-chave.").optional(),
  exemplos: z.array(z.string().trim().min(5)).optional(),
  canais: z.array(z.enum(ORIGENS_CHAMADO)).min(1, "Informe ao menos um canal.").optional(),
  prioridadeSugerida: z.enum(PRIORIDADES).optional(),
  confiancaMinima: z.number().min(0).max(1).optional(),
  ativo: z.boolean().optional(),
  setorId: z.string().uuid("Setor inválido.").optional(),
});

export type DadosCriacaoIntencao = z.infer<typeof schemaCriacaoIntencao>;
export type DadosAtualizacaoIntencao = z.infer<typeof schemaAtualizacaoIntencao>;
