UPDATE "configuracoes_whatsapp"
   SET "mensagem_primeiro_contato" = 'Descreva seu problema desta forma, em uma única mensagem:'
 WHERE "mensagem_primeiro_contato" ILIKE '%Informe seu nome:%'
   AND "mensagem_primeiro_contato" ILIKE '%Assunto:%'
   AND "mensagem_primeiro_contato" ILIKE '%Descri%problema:%';
