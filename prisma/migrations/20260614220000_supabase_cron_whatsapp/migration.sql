CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.disparar_cron_whatsapp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions, vault, net
AS $$
DECLARE
  app_url TEXT;
  cron_secret TEXT;
  endpoint TEXT;
BEGIN
  SELECT decrypted_secret
    INTO app_url
    FROM vault.decrypted_secrets
   WHERE name = 'teste_codificar_app_url'
   LIMIT 1;

  SELECT decrypted_secret
    INTO cron_secret
    FROM vault.decrypted_secrets
   WHERE name = 'teste_codificar_cron_secret'
   LIMIT 1;

  IF app_url IS NULL OR btrim(app_url) = '' THEN
    RAISE EXCEPTION 'Segredo teste_codificar_app_url nao configurado no Supabase Vault.';
  END IF;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION 'Segredo teste_codificar_cron_secret nao configurado no Supabase Vault.';
  END IF;

  endpoint := rtrim(app_url, '/') || '/api/cron/whatsapp';

  PERFORM net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object(
      'origem', 'supabase_cron',
      'executadoEm', now()
    ),
    timeout_milliseconds := 10000
  );
END;
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON FUNCTION private.disparar_cron_whatsapp() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM cron.job
     WHERE jobname = 'teste_codificar_whatsapp_protocolos'
  ) THEN
    PERFORM cron.unschedule('teste_codificar_whatsapp_protocolos');
  END IF;
END;
$$;

SELECT cron.schedule(
  'teste_codificar_whatsapp_protocolos',
  '*/3 * * * *',
  $$SELECT private.disparar_cron_whatsapp();$$
);
