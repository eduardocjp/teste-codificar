import { z } from "zod";

import { PERFIS_USUARIO } from "../../types/dominio";

export const schemaCriacaoResponsavel = z.object({
  nome: z.string().trim().min(3, "Informe o nome do atendente."),
  email: z.string().trim().email("Informe um e-mail válido.").transform((valor) => valor.toLowerCase()),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  perfil: z.enum(PERFIS_USUARIO).default("ATENDENTE"),
  setorId: z.string().uuid("Setor inválido.").nullable().optional(),
  ativo: z.boolean().default(true),
});

export const schemaAtualizacaoResponsavel = z.object({
  nome: z.string().trim().min(3, "Informe o nome do atendente.").optional(),
  email: z.string().trim().email("Informe um e-mail válido.").transform((valor) => valor.toLowerCase()).optional(),
  senha: z
    .preprocess(
      (valor) => (typeof valor === "string" && valor.trim() === "" ? undefined : valor),
      z.string().min(6, "A senha deve ter ao menos 6 caracteres.").optional(),
    ),
  perfil: z.enum(PERFIS_USUARIO).optional(),
  setorId: z.string().uuid("Setor inválido.").nullable().optional(),
  ativo: z.boolean().optional(),
});

export type DadosCriacaoResponsavel = z.infer<typeof schemaCriacaoResponsavel>;
export type DadosAtualizacaoResponsavel = z.infer<typeof schemaAtualizacaoResponsavel>;
