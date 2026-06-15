CREATE TABLE "tentativas_login" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "identificador_hash" VARCHAR(64) NOT NULL,
  "email_hash" VARCHAR(64) NOT NULL,
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "janela_inicio" TIMESTAMP(3) NOT NULL,
  "bloqueado_ate" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tentativas_login_identificador_hash_key" ON "tentativas_login"("identificador_hash");
CREATE INDEX "tentativas_login_email_hash_idx" ON "tentativas_login"("email_hash");
CREATE INDEX "tentativas_login_janela_inicio_idx" ON "tentativas_login"("janela_inicio");
CREATE INDEX "tentativas_login_bloqueado_ate_idx" ON "tentativas_login"("bloqueado_ate");
