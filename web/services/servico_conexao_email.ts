import { randomBytes } from "node:crypto";

const REGEX_IDENTIFICADOR_EMAIL = /^[a-zA-Z0-9_-]+$/;

function validarEnderecoBase(enderecoBase: string): { local: string; dominio: string } {
  const endereco = enderecoBase.trim();
  const partes = endereco.split("@");

  if (partes.length !== 2 || !partes[0] || !partes[1] || /\s/.test(endereco)) {
    throw new Error("Endereço inbound base inválido.");
  }

  return { local: partes[0], dominio: partes[1] };
}

function validarIdentificadorEmail(identificador: string): string {
  const identificadorLimpo = identificador.trim();

  if (!identificadorLimpo) {
    throw new Error("Identificador de e-mail obrigatório.");
  }

  if (!REGEX_IDENTIFICADOR_EMAIL.test(identificadorLimpo)) {
    throw new Error("Identificador de e-mail possui formato inválido.");
  }

  return identificadorLimpo;
}

/**
 * Gera um identificador aleatório para uma futura conexão
 * de encaminhamento de e-mail.
 */
export function gerarIdentificadorEntradaEmail(): string {
  return randomBytes(8).toString("hex");
}

/**
 * Monta um endereço de encaminhamento com plus addressing
 * a partir do endereço inbound base e de um identificador.
 */
export function montarEnderecoEncaminhamentoEmail(enderecoBase: string, identificador: string): string {
  const endereco = validarEnderecoBase(enderecoBase);
  const identificadorSeguro = validarIdentificadorEmail(identificador);

  return `${endereco.local}+${identificadorSeguro}@${endereco.dominio}`;
}

/**
 * Gera um código que poderá ser utilizado futuramente para
 * confirmar o encaminhamento de uma caixa de e-mail.
 */
export function gerarCodigoVerificacaoEmail(): string {
  return `VERIFICAR-${randomBytes(3).toString("hex").toUpperCase()}`;
}
