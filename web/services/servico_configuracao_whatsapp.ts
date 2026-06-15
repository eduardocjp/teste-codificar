import { z } from "zod";

import { obterEnv } from "../lib/env";
import { prisma } from "../lib/prisma";
import { mapearErrosZod } from "../lib/respostas";
import type { ResultadoAcao } from "../types/resultado";
import {
  MENSAGEM_PRIMEIRO_CONTATO_PADRAO,
  normalizarTelefoneWhatsapp,
} from "./servico_processamento_mensagem";

const CHAVE_CONFIGURACAO_WHATSAPP = "principal";
const INTERVALO_QR_MS = 60_000;
const DURACAO_QR_MS = 30_000;

export const MENSAGEM_CONFIRMACAO_CHAMADO_PADRAO = [
  "Seu chamado foi criado com sucesso.",
  "",
  "Protocolo: {protocolo}",
  "Assunto: {assunto}",
  "Setor responsável: {setor}",
  "",
  "Aguarde o atendimento da equipe de suporte.",
].join("\n");

const schemaAtualizacaoConfiguracaoWhatsapp = z.object({
  ativo: z.boolean().optional(),
  numeroAviso: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((valor, ctx) => {
      if (!valor) {
        return null;
      }

      const telefone = normalizarTelefoneWhatsapp(valor);

      if (!telefone) {
        ctx.addIssue({
          code: "custom",
          message: "Informe um telefone válido com DDD.",
        });
        return z.NEVER;
      }

      return telefone;
    }),
  mensagemPrimeiroContato: z
    .string()
    .trim()
    .min(1, "A mensagem de primeiro contato é obrigatória.")
    .optional(),
  mensagemConfirmacaoChamado: z
    .string()
    .trim()
    .min(1, "A mensagem de confirmação do chamado é obrigatória.")
    .optional(),
});

export type DadosConfiguracaoWhatsapp = {
  id: string;
  chave: string;
  ativo: boolean;
  conectado: boolean;
  numeroConectado: string | null;
  numeroAviso: string | null;
  mensagemPrimeiroContato: string;
  mensagemConfirmacaoChamado: string;
  ultimaSolicitacaoQrEm: Date | null;
  novaTentativaQrEm: Date | null;
  conectadoEm: Date | null;
  desconectadoEm: Date | null;
  instanciaNome: string;
  apiHabilitada: boolean;
};

export type DadosJanelaQrWhatsapp = {
  configuracao: DadosConfiguracaoWhatsapp;
  qrExpiraEm: Date;
  novaTentativaQrEm: Date;
};

export type ResultadoSolicitacaoQrWhatsapp =
  | {
      sucesso: true;
      dados: DadosJanelaQrWhatsapp;
    }
  | {
      sucesso: false;
      bloqueado: true;
      mensagem: string;
      dados: DadosJanelaQrWhatsapp;
    };

function obterNomeInstanciaWhatsapp(): string {
  return obterEnv().EVOLUTION_API_INSTANCIA?.trim() || "teste_cod_01";
}

function mapearConfiguracao(
  configuracao: {
    id: string;
    chave: string;
    ativo: boolean;
    conectado: boolean;
    numeroConectado: string | null;
    numeroAviso: string | null;
    mensagemPrimeiroContato: string;
    mensagemConfirmacaoChamado: string;
    ultimaSolicitacaoQrEm: Date | null;
    novaTentativaQrEm: Date | null;
    conectadoEm: Date | null;
    desconectadoEm: Date | null;
  },
): DadosConfiguracaoWhatsapp {
  return {
    ...configuracao,
    instanciaNome: obterNomeInstanciaWhatsapp(),
    apiHabilitada: obterEnv().EVOLUTION_API_HABILITADA === "true",
  };
}

/**
 * Obtém a configuração única do WhatsApp, criando o registro padrão quando necessário.
 */
export async function obterConfiguracaoWhatsapp(): Promise<DadosConfiguracaoWhatsapp> {
  const configuracao = await prisma.configuracaoWhatsapp.upsert({
    where: { chave: CHAVE_CONFIGURACAO_WHATSAPP },
    update: {},
    create: {
      chave: CHAVE_CONFIGURACAO_WHATSAPP,
      mensagemPrimeiroContato: MENSAGEM_PRIMEIRO_CONTATO_PADRAO,
      mensagemConfirmacaoChamado: MENSAGEM_CONFIRMACAO_CHAMADO_PADRAO,
    },
  });

  return mapearConfiguracao(configuracao);
}

/**
 * Atualiza a automação, número de aviso e modelos de mensagens do WhatsApp.
 */
export async function salvarConfiguracaoWhatsapp(dados: unknown): Promise<ResultadoAcao<DadosConfiguracaoWhatsapp>> {
  const validacao = schemaAtualizacaoConfiguracaoWhatsapp.safeParse(dados);

  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: "Não foi possível salvar a configuração do WhatsApp.",
      errosCampos: mapearErrosZod(validacao.error),
    };
  }

  await obterConfiguracaoWhatsapp();

  const atualizada = await prisma.configuracaoWhatsapp.update({
    where: { chave: CHAVE_CONFIGURACAO_WHATSAPP },
    data: {
      ativo: validacao.data.ativo,
      numeroAviso: validacao.data.numeroAviso,
      mensagemPrimeiroContato: validacao.data.mensagemPrimeiroContato,
      mensagemConfirmacaoChamado: validacao.data.mensagemConfirmacaoChamado,
    },
  });

  return { sucesso: true, dados: mapearConfiguracao(atualizada) };
}

/**
 * Persiste o aceite de uma nova solicitação de QR Code respeitando o bloqueio de 60 segundos.
 */
export async function registrarSolicitacaoQrWhatsapp(
  agora = new Date(),
): Promise<ResultadoSolicitacaoQrWhatsapp> {
  const configuracao = await obterConfiguracaoWhatsapp();

  if (configuracao.novaTentativaQrEm && configuracao.novaTentativaQrEm > agora) {
    return {
      sucesso: false,
      bloqueado: true,
      mensagem: "Aguarde a liberação de nova tentativa de QR Code.",
      dados: {
        configuracao,
        qrExpiraEm: new Date(agora.getTime()),
        novaTentativaQrEm: configuracao.novaTentativaQrEm,
      },
    };
  }

  const novaTentativaQrEm = new Date(agora.getTime() + INTERVALO_QR_MS);
  const qrExpiraEm = new Date(agora.getTime() + DURACAO_QR_MS);
  const atualizada = await prisma.configuracaoWhatsapp.update({
    where: { chave: CHAVE_CONFIGURACAO_WHATSAPP },
    data: {
      ultimaSolicitacaoQrEm: agora,
      novaTentativaQrEm,
    },
  });

  return {
    sucesso: true,
    dados: {
      configuracao: mapearConfiguracao(atualizada),
      qrExpiraEm,
      novaTentativaQrEm,
    },
  };
}

/**
 * Atualiza o estado persistido da conexão quando a Evolution confirma conexão.
 */
export async function marcarWhatsappConectado(numeroConectado?: string | null): Promise<DadosConfiguracaoWhatsapp> {
  await obterConfiguracaoWhatsapp();

  const atualizada = await prisma.configuracaoWhatsapp.update({
    where: { chave: CHAVE_CONFIGURACAO_WHATSAPP },
    data: {
      conectado: true,
      numeroConectado: normalizarTelefoneWhatsapp(numeroConectado) ?? undefined,
      conectadoEm: new Date(),
      desconectadoEm: null,
    },
  });

  return mapearConfiguracao(atualizada);
}

/**
 * Marca a configuração como desconectada sem remover históricos de sessões ou chamados.
 */
export async function marcarWhatsappDesconectado(): Promise<DadosConfiguracaoWhatsapp> {
  await obterConfiguracaoWhatsapp();

  const atualizada = await prisma.configuracaoWhatsapp.update({
    where: { chave: CHAVE_CONFIGURACAO_WHATSAPP },
    data: {
      conectado: false,
      numeroConectado: null,
      desconectadoEm: new Date(),
    },
  });

  return mapearConfiguracao(atualizada);
}
