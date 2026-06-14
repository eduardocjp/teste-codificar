ALTER TABLE "configuracoes_whatsapp"
ADD COLUMN IF NOT EXISTS "mensagem_confirmacao_chamado" TEXT NOT NULL DEFAULT 'Seu chamado foi criado com sucesso.

Protocolo: {protocolo}
Assunto: {assunto}
Setor responsável: {setor}

Aguarde o atendimento da equipe de suporte.';
