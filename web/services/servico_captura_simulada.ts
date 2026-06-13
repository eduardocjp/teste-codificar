import { randomUUID } from "node:crypto";

import { z } from "zod";

import { prisma } from "../lib/prisma";
import { mapearErrosZod } from "../lib/respostas";
import { analisarMensagemIntentSolver } from "../modules/intents/servico_intencao";
import { criarChamadoComDistribuicao } from "../modules/tickets/servico_chamado";
import type { ChamadoComRelacoes } from "../types/chamado";
import type { ResultadoResolucaoIntencao } from "../types/intencao";
import type { ResultadoAcao } from "../types/resultado";
import { limitarTexto } from "../utils/utils";

const schemaCapturaEmail = z.object({
  canal: z.literal("EMAIL"),
  remetente: z.string().trim().email("Informe o e-mail do remetente."),
  assunto: z.string().trim().min(3, "Informe o assunto do e-mail."),
  conteudo: z.string().trim().min(10, "Informe o conteúdo do e-mail."),
  criarChamado: z.boolean().default(true),
});

const schemaCapturaWhatsapp = z.object({
  canal: z.literal("WHATSAPP"),
  nome: z.string().trim().min(2, "Informe o nome do solicitante."),
  numero: z.string().trim().min(8, "Informe o número do WhatsApp."),
  mensagem: z.string().trim().min(5, "Informe a mensagem recebida."),
  respostaEstruturada: z.string().trim().optional(),
  criarChamado: z.boolean().default(true),
});

export const schemaCapturaSimulada = z.discriminatedUnion("canal", [
  schemaCapturaEmail,
  schemaCapturaWhatsapp,
]);

type DadosCapturaEmail = z.infer<typeof schemaCapturaEmail>;
type DadosCapturaWhatsapp = z.infer<typeof schemaCapturaWhatsapp>;

export type ResultadoCapturaSimulada = {
  canal: "EMAIL" | "WHATSAPP";
  remetente: string;
  mensagemRecebida: string;
  assuntoExtraido: string;
  corpoExtraido: string;
  precisaRespostaEstruturada: boolean;
  respostaSolicitada: string | null;
  resultadoIntencao: ResultadoResolucaoIntencao;
  conversaId: string | null;
  chamado: ChamadoComRelacoes | null;
};

export type CamposEstruturadosWhatsapp = {
  assunto: string | null;
  mensagem: string | null;
  completo: boolean;
};

/**
 * Extrai campos de uma resposta simulada no formato solicitado pelo WhatsApp.
 */
export function extrairCamposEstruturadosWhatsapp(texto: string): CamposEstruturadosWhatsapp {
  const assunto = texto.match(/(?:^|\n)\s*assunto\s*:\s*([^\n\r]+)/i)?.[1]?.trim() ?? null;
  const mensagem =
    texto.match(/(?:^|\n)\s*(?:mensagem|conte[uú]do|descricao|descrição)\s*:\s*([\s\S]+)/i)?.[1]?.trim() ?? null;

  return {
    assunto,
    mensagem,
    completo: Boolean(assunto && mensagem),
  };
}

function montarRespostaEstruturada(resultado: ResultadoResolucaoIntencao): string {
  return [
    "Para abrir o chamado, responda exatamente neste formato:",
    `Assunto: ${resultado.assuntoSugerido}`,
    "Mensagem: descreva o problema, impacto e local afetado.",
  ].join("\n");
}

function montarDescricaoEmail(dados: DadosCapturaEmail): string {
  return [
    "Origem simulada: E-mail",
    `Remetente: ${dados.remetente}`,
    `Assunto informado: ${dados.assunto}`,
    "",
    "Conteúdo:",
    dados.conteudo,
  ].join("\n");
}

function montarDescricaoWhatsapp(dados: DadosCapturaWhatsapp, corpoExtraido: string): string {
  return [
    "Origem simulada: WhatsApp",
    `Solicitante: ${dados.nome}`,
    `Número: ${dados.numero}`,
    "",
    "Mensagem:",
    corpoExtraido,
  ].join("\n");
}

async function registrarConversaSimulada(dados: {
  remetente: string;
  mensagem: string;
  origem: "EMAIL" | "WHATSAPP";
  resultado: ResultadoResolucaoIntencao;
  chamadoId?: string;
}): Promise<string> {
  const conversa = await prisma.conversa.create({
    data: {
      remetente: dados.remetente,
      mensagem: dados.mensagem,
      origem: dados.origem,
      identificadorExterno: `simulador:${dados.origem.toLowerCase()}:${randomUUID()}`,
      assuntoIdentificado: dados.resultado.assuntoSugerido,
      confianca: dados.resultado.confianca,
      intencaoId: dados.resultado.intencaoId,
      setorId: dados.resultado.setorId,
      chamadoId: dados.chamadoId,
    },
    select: { id: true },
  });

  return conversa.id;
}

async function criarChamadoSimulado(dados: {
  titulo: string;
  descricao: string;
  assunto: string;
  resultado: ResultadoResolucaoIntencao;
  origem: "EMAIL" | "WHATSAPP";
}): Promise<ResultadoAcao<ChamadoComRelacoes>> {
  return criarChamadoComDistribuicao({
    titulo: limitarTexto(dados.titulo, 150),
    descricao: dados.descricao,
    assunto: limitarTexto(dados.assunto, 150),
    prioridade: dados.resultado.prioridadeSugerida,
    status: "ABERTO",
    setorId: dados.resultado.setorId,
    intencaoId: dados.resultado.intencaoId ?? undefined,
    confiancaIntencao: dados.resultado.confianca,
    origem: dados.origem,
    atribuicaoAutomatica: true,
  });
}

async function processarEmail(dados: DadosCapturaEmail): Promise<ResultadoAcao<ResultadoCapturaSimulada>> {
  const mensagemRecebida = `${dados.assunto}\n${dados.conteudo}`;
  const analise = await analisarMensagemIntentSolver(mensagemRecebida, "EMAIL");

  if (!analise.sucesso) {
    return analise;
  }

  let chamado: ChamadoComRelacoes | null = null;

  if (dados.criarChamado) {
    const criado = await criarChamadoSimulado({
      titulo: analise.dados.tituloSugerido,
      descricao: montarDescricaoEmail(dados),
      assunto: dados.assunto || analise.dados.assuntoSugerido,
      resultado: analise.dados,
      origem: "EMAIL",
    });

    if (!criado.sucesso) {
      return criado;
    }

    chamado = criado.dados;
  }

  const conversaId = await registrarConversaSimulada({
    remetente: dados.remetente,
    mensagem: mensagemRecebida,
    origem: "EMAIL",
    resultado: analise.dados,
    chamadoId: chamado?.id,
  });

  return {
    sucesso: true,
    dados: {
      canal: "EMAIL",
      remetente: dados.remetente,
      mensagemRecebida,
      assuntoExtraido: dados.assunto,
      corpoExtraido: dados.conteudo,
      precisaRespostaEstruturada: false,
      respostaSolicitada: null,
      resultadoIntencao: analise.dados,
      conversaId,
      chamado,
    },
  };
}

async function processarWhatsapp(dados: DadosCapturaWhatsapp): Promise<ResultadoAcao<ResultadoCapturaSimulada>> {
  const textoEstruturado = dados.respostaEstruturada?.trim() || dados.mensagem;
  const campos = extrairCamposEstruturadosWhatsapp(textoEstruturado);
  const mensagemParaAnalise = campos.completo ? `${campos.assunto}\n${campos.mensagem}` : dados.mensagem;
  const analise = await analisarMensagemIntentSolver(mensagemParaAnalise, "WHATSAPP");

  if (!analise.sucesso) {
    return analise;
  }

  const remetente = `${dados.nome} (${dados.numero})`;

  if (!campos.completo) {
    const conversaId = await registrarConversaSimulada({
      remetente,
      mensagem: dados.mensagem,
      origem: "WHATSAPP",
      resultado: analise.dados,
    });

    return {
      sucesso: true,
      dados: {
        canal: "WHATSAPP",
        remetente,
        mensagemRecebida: dados.mensagem,
        assuntoExtraido: analise.dados.assuntoSugerido,
        corpoExtraido: dados.mensagem,
        precisaRespostaEstruturada: true,
        respostaSolicitada: montarRespostaEstruturada(analise.dados),
        resultadoIntencao: analise.dados,
        conversaId,
        chamado: null,
      },
    };
  }

  let chamado: ChamadoComRelacoes | null = null;

  if (dados.criarChamado) {
    const criado = await criarChamadoSimulado({
      titulo: campos.assunto ?? analise.dados.tituloSugerido,
      descricao: montarDescricaoWhatsapp(dados, campos.mensagem ?? dados.mensagem),
      assunto: campos.assunto ?? analise.dados.assuntoSugerido,
      resultado: analise.dados,
      origem: "WHATSAPP",
    });

    if (!criado.sucesso) {
      return criado;
    }

    chamado = criado.dados;
  }

  const conversaId = await registrarConversaSimulada({
    remetente,
    mensagem: textoEstruturado,
    origem: "WHATSAPP",
    resultado: analise.dados,
    chamadoId: chamado?.id,
  });

  return {
    sucesso: true,
    dados: {
      canal: "WHATSAPP",
      remetente,
      mensagemRecebida: textoEstruturado,
      assuntoExtraido: campos.assunto ?? analise.dados.assuntoSugerido,
      corpoExtraido: campos.mensagem ?? dados.mensagem,
      precisaRespostaEstruturada: false,
      respostaSolicitada: null,
      resultadoIntencao: analise.dados,
      conversaId,
      chamado,
    },
  };
}

/**
 * Simula captura por e-mail ou WhatsApp e reaproveita o fluxo real de chamados.
 */
export async function processarCapturaSimulada(dados: unknown): Promise<ResultadoAcao<ResultadoCapturaSimulada>> {
  const validacao = schemaCapturaSimulada.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos para a simulação.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  if (validacao.data.canal === "EMAIL") {
    return processarEmail(validacao.data);
  }

  return processarWhatsapp(validacao.data);
}
