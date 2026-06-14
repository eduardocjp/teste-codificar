import type { PayloadWebhookEmailPostmark } from "./schema_webhook_email";
import type { MensagemEmailNormalizada } from "../types/mensagem_email";

function limparTexto(valor: string | null | undefined): string {
  return valor?.trim().replace(/\s+/g, " ") ?? "";
}

function obterConteudoPrincipal(dados: PayloadWebhookEmailPostmark): string {
  return limparTexto(dados.StrippedTextReply)
    || limparTexto(dados.TextBody)
    || limparTexto(dados.Subject);
}

function obterAssunto(dados: PayloadWebhookEmailPostmark): string | null {
  const assunto = limparTexto(dados.Subject);
  return assunto || null;
}

function obterNomeRemetente(dados: PayloadWebhookEmailPostmark): string | null {
  const nome = limparTexto(dados.FromName) || limparTexto(dados.FromFull?.Name);
  return nome || null;
}

function obterIdentificadorRoteamento(dados: PayloadWebhookEmailPostmark): string {
  return limparTexto(dados.MailboxHash)
    || limparTexto(dados.FromFull?.MailboxHash)
    || limparTexto(dados.ToFull[0]?.MailboxHash);
}

function obterCabecalhos(dados: PayloadWebhookEmailPostmark): Record<string, string> {
  return dados.Headers.reduce<Record<string, string>>((cabecalhos, cabecalho) => {
    const nome = cabecalho.Name.trim().toLowerCase();

    if (nome) {
      cabecalhos[nome] = cabecalho.Value.trim();
    }

    return cabecalhos;
  }, {});
}

function obterDataRecebimento(data: string | null | undefined, agora: Date): Date {
  const dataRecebida = data ? new Date(data) : null;

  if (dataRecebida && !Number.isNaN(dataRecebida.getTime())) {
    return dataRecebida;
  }

  return agora;
}

/**
 * Converte o payload validado do Postmark para o formato
 * interno normalizado de mensagens recebidas por e-mail.
 */
export function adaptarEmailPostmark(
  dados: PayloadWebhookEmailPostmark,
  agora: Date = new Date(),
): MensagemEmailNormalizada {
  return {
    canal: "EMAIL",
    identificadorExterno: dados.MessageID,
    identificadorRoteamento: obterIdentificadorRoteamento(dados),
    remetente: dados.From,
    nomeRemetente: obterNomeRemetente(dados),
    destinatario: dados.To,
    assunto: obterAssunto(dados),
    conteudo: obterConteudoPrincipal(dados),
    cabecalhos: obterCabecalhos(dados),
    possuiAnexos: dados.Attachments.length > 0,
    recebidoEm: obterDataRecebimento(dados.Date, agora),
  };
}

/**
 * Identifica mensagens automáticas, listas, lixo ou respostas
 * automáticas que não devem gerar chamados futuramente.
 */
export function deveIgnorarEmailAutomatico(cabecalhos: Record<string, string>): boolean {
  const normalizados = Object.entries(cabecalhos).reduce<Record<string, string>>((resultado, [chave, valor]) => {
    resultado[chave.trim().toLowerCase()] = valor.trim().toLowerCase();
    return resultado;
  }, {});

  const autoSubmitted = normalizados["auto-submitted"];
  const precedence = normalizados.precedence;

  return autoSubmitted === "auto-replied"
    || autoSubmitted === "auto-generated"
    || precedence === "bulk"
    || precedence === "junk"
    || precedence === "list"
    || Boolean(normalizados["x-auto-response-suppress"]);
}

/**
 * Combina o assunto e o corpo textual do e-mail para futura
 * análise pelo Intent Solver.
 */
export function montarTextoAnaliseEmail(assunto: string | null, conteudo: string): string {
  const assuntoLimpo = limparTexto(assunto);
  const conteudoLimpo = limparTexto(conteudo);

  if (!assuntoLimpo && !conteudoLimpo) {
    return "";
  }

  if (!assuntoLimpo) {
    return conteudoLimpo;
  }

  if (!conteudoLimpo) {
    return assuntoLimpo;
  }

  const separador = /[.!?]$/.test(assuntoLimpo) ? " " : ". ";

  return `${assuntoLimpo}${separador}${conteudoLimpo}`.replace(/\s+/g, " ").trim();
}
