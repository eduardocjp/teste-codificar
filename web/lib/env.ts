import { z } from "zod";

const schemaEnv = z.object({
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SESSAO_NOME_COOKIE: z.string().min(1).default("sessao_chamados"),
  SESSAO_DURACAO_HORAS: z.coerce.number().positive().default(8),
  NEXT_PUBLIC_NOME_APLICACAO: z.string().min(1).default("Sistema de Chamados"),
  PROVEDOR_MENSAGENS: z.enum(["simulador", "evolution"]).default("simulador"),
  EVOLUTION_API_HABILITADA: z.enum(["true", "false"]).default("false"),
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_API_CHAVE: z.string().optional(),
  EVOLUTION_API_INSTANCIA: z.string().optional(),
  EVOLUTION_WEBHOOK_SEGREDO: z.string().optional(),
  EMAIL_CAPTURA_HABILITADA: z.enum(["true", "false"]).default("false"),
  EMAIL_ENDERECO_SUPORTE: z.string().optional(),
  EMAIL_IMAP_HOST: z.string().optional(),
  EMAIL_IMAP_PORTA: z.string().optional(),
  EMAIL_IMAP_USUARIO: z.string().optional(),
  EMAIL_IMAP_SENHA: z.string().optional(),
  EMAIL_RESPOSTAS_HABILITADAS: z.enum(["true", "false"]).default("false"),
});

export type EnvAplicacao = z.infer<typeof schemaEnv>;

/**
 * Valida variáveis de ambiente sem exigir segredos durante build local.
 */
export function obterEnv(): EnvAplicacao {
  return schemaEnv.parse(process.env);
}

/**
 * Retorna a URL de banco usada pelo Prisma Client em runtime.
 */
export function obterDatabaseUrl(): string {
  const env = obterEnv();

  return env.DATABASE_URL ?? "postgresql://usuario:senha@localhost:5432/mvsoft_eventos";
}
