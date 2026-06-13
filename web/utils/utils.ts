import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza textos em português para comparação determinística.
 */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Limita textos longos preservando palavras quando possível.
 */
export function limitarTexto(valor: string, limite: number): string {
  if (valor.length <= limite) {
    return valor;
  }

  const cortado = valor.slice(0, limite).trim();
  const ultimoEspaco = cortado.lastIndexOf(" ");

  if (ultimoEspaco < limite * 0.6) {
    return `${cortado}...`;
  }

  return `${cortado.slice(0, ultimoEspaco)}...`;
}

/**
 * Formata datas para exibição compacta em pt-BR.
 */
export function formatarDataHora(data: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}
