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

export type DadosCriacaoResponsavel = z.infer<typeof schemaCriacaoResponsavel>;
