type LoggerMeta = Record<string, string | number | boolean | null | undefined>;

function escreverLog(nivel: "info" | "warn" | "error", contexto: string, meta?: LoggerMeta): void {
  const payload = {
    nivel,
    contexto,
    meta: meta ?? {},
    data: new Date().toISOString(),
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);
}

/**
 * Registra evento informativo sem expor dados sensíveis.
 */
export function logInfo(contexto: string, meta?: LoggerMeta): void {
  escreverLog("info", contexto, meta);
}

/**
 * Registra alerta operacional sem expor dados sensíveis.
 */
export function logWarn(contexto: string, meta?: LoggerMeta): void {
  escreverLog("warn", contexto, meta);
}

/**
 * Registra erro operacional sem expor stack trace ao usuário.
 */
export function logError(contexto: string, erro: unknown, meta?: LoggerMeta): void {
  const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
  escreverLog("error", contexto, { ...meta, mensagem });
}
