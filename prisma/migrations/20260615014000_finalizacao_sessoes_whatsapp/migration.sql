ALTER TABLE "sessoes_whatsapp"
ADD COLUMN "finalizado_em" TIMESTAMP(3);

CREATE INDEX "sessoes_whatsapp_finalizado_em_idx" ON "sessoes_whatsapp"("finalizado_em");
