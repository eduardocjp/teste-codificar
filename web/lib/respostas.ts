import { ZodError } from "zod";

/**
 * Converte erros do Zod para o formato padrão de campos.
 */
export function mapearErrosZod(erro: ZodError): Record<string, string[]> {
  const campos: Record<string, string[]> = {};

  for (const issue of erro.issues) {
    const chave = issue.path.join(".") || "formulario";
    campos[chave] = [...(campos[chave] ?? []), issue.message];
  }

  return campos;
}

/**
 * Lê JSON de uma requisição sem propagar erro de parse.
 */
export async function lerJsonSeguro(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
