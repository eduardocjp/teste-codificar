CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "PerfilUsuario" AS ENUM ('ADMINISTRADOR', 'ATENDENTE');
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO');
CREATE TYPE "OrigemChamado" AS ENUM ('MANUAL', 'SIMULADOR', 'WHATSAPP');

CREATE TABLE "setores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(100) NOT NULL,
  "descricao" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "eh_triagem" BOOLEAN NOT NULL DEFAULT false,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(120) NOT NULL,
  "email" VARCHAR(160) NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "perfil" "PerfilUsuario" NOT NULL DEFAULT 'ATENDENTE',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "setor_id" UUID,
  "ultima_atribuicao" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "token_hash" TEXT NOT NULL,
  "usuario_id" UUID NOT NULL,
  "expira_em" TIMESTAMP(3) NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intencoes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(120) NOT NULL,
  "slug" VARCHAR(140) NOT NULL,
  "descricao" TEXT,
  "assunto_sugerido" VARCHAR(160) NOT NULL,
  "palavras_chave" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "exemplos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "prioridade_sugerida" "Prioridade" NOT NULL DEFAULT 'MEDIA',
  "confianca_minima" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "setor_id" UUID NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "intencoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chamados" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "titulo" VARCHAR(160) NOT NULL,
  "descricao" TEXT NOT NULL,
  "assunto" VARCHAR(160),
  "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
  "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
  "origem" "OrigemChamado" NOT NULL DEFAULT 'MANUAL',
  "setor_id" UUID NOT NULL,
  "responsavel_id" UUID,
  "intencao_id" UUID,
  "confianca_intencao" DOUBLE PRECISION,
  "data_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data_resolucao" TIMESTAMP(3),
  "data_fechamento" TIMESTAMP(3),
  CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "remetente" VARCHAR(160),
  "mensagem" TEXT NOT NULL,
  "origem" "OrigemChamado" NOT NULL,
  "identificador_externo" VARCHAR(200),
  "assunto_identificado" VARCHAR(160),
  "confianca" DOUBLE PRECISION,
  "intencao_id" UUID,
  "setor_id" UUID,
  "chamado_id" UUID,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "setores_nome_key" ON "setores"("nome");
CREATE UNIQUE INDEX "setores_triagem_unica" ON "setores"("eh_triagem") WHERE "eh_triagem" = true;
CREATE INDEX "setores_ativo_idx" ON "setores"("ativo");

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "usuarios_setor_id_ativo_idx" ON "usuarios"("setor_id", "ativo");

CREATE UNIQUE INDEX "sessoes_token_hash_key" ON "sessoes"("token_hash");
CREATE INDEX "sessoes_usuario_id_idx" ON "sessoes"("usuario_id");
CREATE INDEX "sessoes_expira_em_idx" ON "sessoes"("expira_em");

CREATE UNIQUE INDEX "intencoes_slug_key" ON "intencoes"("slug");
CREATE INDEX "intencoes_setor_id_ativo_idx" ON "intencoes"("setor_id", "ativo");

CREATE INDEX "chamados_status_prioridade_idx" ON "chamados"("status", "prioridade");
CREATE INDEX "chamados_setor_id_status_idx" ON "chamados"("setor_id", "status");
CREATE INDEX "chamados_responsavel_id_status_idx" ON "chamados"("responsavel_id", "status");
CREATE INDEX "chamados_data_abertura_idx" ON "chamados"("data_abertura");

CREATE UNIQUE INDEX "conversas_identificador_externo_key" ON "conversas"("identificador_externo");
CREATE INDEX "conversas_origem_criado_em_idx" ON "conversas"("origem", "criado_em");
CREATE INDEX "conversas_chamado_id_idx" ON "conversas"("chamado_id");

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "intencoes" ADD CONSTRAINT "intencoes_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_intencao_id_fkey" FOREIGN KEY ("intencao_id") REFERENCES "intencoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_intencao_id_fkey" FOREIGN KEY ("intencao_id") REFERENCES "intencoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
