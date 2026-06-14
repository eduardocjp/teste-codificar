import { normalizarTexto } from "../utils/utils";

export const MENSAGEM_PRIMEIRO_CONTATO_PADRAO = [
  "Descreva seu problema desta forma, em uma única mensagem:",
  "",
  "Informe seu nome:",
  "Assunto:",
  "Descrição do problema:",
].join("\n");

export type CampoSolicitacaoWhatsapp = "nome" | "assunto" | "descricao";

export type ResultadoExtracaoSolicitacaoWhatsapp =
  | {
      valida: true;
      nome: string;
      assunto: string;
      descricao: string;
    }
  | {
      valida: false;
      camposAusentes: CampoSolicitacaoWhatsapp[];
    };

function removerLabel(valor: string, labelsAceitos: string[]): string | null {
  const partes = valor.split(":");

  if (partes.length < 2) {
    return null;
  }

  const label = normalizarTexto(partes[0] ?? "");

  if (!labelsAceitos.includes(label)) {
    return null;
  }

  return partes.slice(1).join(":").trim();
}

function adicionarCampoAusente(
  camposAusentes: CampoSolicitacaoWhatsapp[],
  campo: CampoSolicitacaoWhatsapp,
): void {
  if (!camposAusentes.includes(campo)) {
    camposAusentes.push(campo);
  }
}

/**
 * Normaliza telefone de WhatsApp removendo JID, símbolos e espaços.
 */
export function normalizarTelefoneWhatsapp(valor: string | null | undefined): string | null {
  if (!valor) {
    return null;
  }

  const telefone = valor.split("@")[0]?.replace(/\D/g, "") ?? "";

  if (telefone.length < 10 || telefone.length > 15) {
    return null;
  }

  return telefone;
}

/**
 * Verifica se a mensagem de primeiro contato possui os campos mínimos exigidos.
 */
export function mensagemPrimeiroContatoValida(mensagem: string): boolean {
  const texto = normalizarTexto(mensagem);

  return texto.includes("nome") && texto.includes("assunto") && texto.includes("descricao");
}

/**
 * Extrai nome, assunto e descrição de uma resposta estruturada enviada por WhatsApp.
 */
export function extrairSolicitacaoWhatsapp(mensagem: string): ResultadoExtracaoSolicitacaoWhatsapp {
  const linhas = mensagem
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);
  const camposAusentes: CampoSolicitacaoWhatsapp[] = [];

  if (linhas.length < 3) {
    adicionarCampoAusente(camposAusentes, "nome");
    adicionarCampoAusente(camposAusentes, "assunto");
    adicionarCampoAusente(camposAusentes, "descricao");

    return { valida: false, camposAusentes };
  }

  const nome = removerLabel(linhas[0] ?? "", ["nome", "informe seu nome"]);
  const assunto = removerLabel(linhas[1] ?? "", ["assunto"]);
  const descricaoPrimeiraLinha = removerLabel(linhas[2] ?? "", [
    "descricao",
    "descricao do problema",
    "problema",
  ]);
  const descricao = descricaoPrimeiraLinha === null
    ? null
    : [descricaoPrimeiraLinha, ...linhas.slice(3)].join("\n").trim();

  if (!nome) {
    adicionarCampoAusente(camposAusentes, "nome");
  }

  if (!assunto) {
    adicionarCampoAusente(camposAusentes, "assunto");
  }

  if (!descricao) {
    adicionarCampoAusente(camposAusentes, "descricao");
  }

  if (camposAusentes.length > 0 || nome === null || assunto === null || descricao === null) {
    return { valida: false, camposAusentes };
  }

  return { valida: true, nome, assunto, descricao };
}
