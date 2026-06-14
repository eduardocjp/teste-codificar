CREATE TYPE "EstadoSessaoWhatsapp" AS ENUM ('AGUARDANDO_DADOS', 'CHAMADO_CRIADO', 'EM_ATENDIMENTO', 'EXPIRADA');
CREATE TYPE "TipoMensagemAutomaticaWhatsapp" AS ENUM ('ORIENTACAO_INICIAL', 'SOLICITACAO_CORRECAO', 'PROTOCOLO', 'AVISO_SUPORTE', 'OUTRA_AUTOMACAO');

ALTER TABLE "chamados"
ADD COLUMN "protocolo" VARCHAR(40),
ADD COLUMN "solicitante_nome" VARCHAR(160),
ADD COLUMN "solicitante_telefone" VARCHAR(32);

CREATE UNIQUE INDEX "chamados_protocolo_key" ON "chamados"("protocolo");

CREATE TABLE "configuracoes_whatsapp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chave" VARCHAR(40) NOT NULL DEFAULT 'principal',
  "ativo" BOOLEAN NOT NULL DEFAULT false,
  "conectado" BOOLEAN NOT NULL DEFAULT false,
  "numero_conectado" VARCHAR(32),
  "numero_aviso" VARCHAR(32),
  "mensagem_primeiro_contato" TEXT NOT NULL,
  "ultima_solicitacao_qr_em" TIMESTAMP(3),
  "nova_tentativa_qr_em" TIMESTAMP(3),
  "conectado_em" TIMESTAMP(3),
  "desconectado_em" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "configuracoes_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "configuracoes_whatsapp_chave_key" ON "configuracoes_whatsapp"("chave");

CREATE TABLE "sessoes_whatsapp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "telefone_cliente" VARCHAR(32) NOT NULL,
  "estado" "EstadoSessaoWhatsapp" NOT NULL,
  "chamado_id" UUID,
  "primeira_mensagem_em" TIMESTAMP(3) NOT NULL,
  "ultima_interacao_em" TIMESTAMP(3) NOT NULL,
  "ultima_resposta_humana_em" TIMESTAMP(3),
  "expira_em" TIMESTAMP(3) NOT NULL,
  "orientacao_enviada" BOOLEAN NOT NULL DEFAULT false,
  "aviso_suporte_enviado" BOOLEAN NOT NULL DEFAULT false,
  "protocolo_agendado_para" TIMESTAMP(3),
  "protocolo_enviado_em" TIMESTAMP(3),
  "tentativas_envio" INTEGER NOT NULL DEFAULT 0,
  "ultimo_erro_envio" TEXT,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessoes_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessoes_whatsapp_telefone_cliente_estado_idx" ON "sessoes_whatsapp"("telefone_cliente", "estado");
CREATE INDEX "sessoes_whatsapp_expira_em_idx" ON "sessoes_whatsapp"("expira_em");
CREATE INDEX "sessoes_whatsapp_protocolo_agendado_para_protocolo_enviado_em_idx" ON "sessoes_whatsapp"("protocolo_agendado_para", "protocolo_enviado_em");

CREATE TABLE "envios_automaticos_whatsapp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "identificador_externo" VARCHAR(200),
  "tipo" "TipoMensagemAutomaticaWhatsapp" NOT NULL,
  "destinatario" VARCHAR(32) NOT NULL,
  "conteudo_hash" VARCHAR(64) NOT NULL,
  "conteudo_resumo" VARCHAR(240),
  "sessao_whatsapp_id" UUID,
  "chamado_id" UUID,
  "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "envios_automaticos_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "envios_automaticos_whatsapp_identificador_externo_key" ON "envios_automaticos_whatsapp"("identificador_externo");
CREATE INDEX "envios_automaticos_whatsapp_destinatario_enviado_em_idx" ON "envios_automaticos_whatsapp"("destinatario", "enviado_em");
CREATE INDEX "envios_automaticos_whatsapp_sessao_whatsapp_id_idx" ON "envios_automaticos_whatsapp"("sessao_whatsapp_id");
CREATE INDEX "envios_automaticos_whatsapp_chamado_id_idx" ON "envios_automaticos_whatsapp"("chamado_id");

ALTER TABLE "sessoes_whatsapp" ADD CONSTRAINT "sessoes_whatsapp_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "envios_automaticos_whatsapp" ADD CONSTRAINT "envios_automaticos_whatsapp_sessao_whatsapp_id_fkey" FOREIGN KEY ("sessao_whatsapp_id") REFERENCES "sessoes_whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "envios_automaticos_whatsapp" ADD CONSTRAINT "envios_automaticos_whatsapp_chamado_id_fkey" FOREIGN KEY ("chamado_id") REFERENCES "chamados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
