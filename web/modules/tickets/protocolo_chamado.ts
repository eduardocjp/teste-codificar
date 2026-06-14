import { randomBytes } from "node:crypto";

function doisDigitos(valor: number): string {
  return valor.toString().padStart(2, "0");
}

function formatarDataProtocolo(data: Date): string {
  const ano = data.getFullYear();
  const mes = doisDigitos(data.getMonth() + 1);
  const dia = doisDigitos(data.getDate());

  return `${ano}${mes}${dia}`;
}

/**
 * Gera um protocolo legível e curto para exibição ao solicitante do chamado.
 */
export function gerarProtocoloChamado(data = new Date(), sufixo?: string): string {
  const codigo = (sufixo ?? randomBytes(3).toString("hex")).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();

  return `CHA-${formatarDataProtocolo(data)}-${codigo.padEnd(6, "0")}`;
}
