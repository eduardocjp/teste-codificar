import type { Prisma } from "../../src/generated/prisma/client";

import { prisma } from "../lib/prisma";
import type { ConversaAtendimentoResumo, MensagemConversaResumo } from "../types/conversa";
import type { ResultadoAcao } from "../types/resultado";
import type { SessaoUsuario } from "../types/usuario";
import { logInfo } from "../utils/logger";

const LIMITE_CONVERSAS = 50;
const LIMITE_MENSAGENS_POR_CONVERSA = 20;

const includeSessaoWhatsapp = {
  chamado: {
    select: {
      id: true,
      protocolo: true,
      titulo: true,
      assunto: true,
      setor: { select: { id: true, nome: true } },
      responsavel: { select: { id: true, nome: true, email: true } },
    },
  },
} satisfies Prisma.SessaoWhatsappInclude;

type SessaoWhatsappComChamado = Prisma.SessaoWhatsappGetPayload<{
  include: typeof includeSessaoWhatsapp;
}>;

function montarWhereSessoesWhatsapp(sessao: SessaoUsuario): Prisma.SessaoWhatsappWhereInput {
  if (sessao.perfil === "ADMINISTRADOR") {
    return {};
  }

  const filtros: Prisma.SessaoWhatsappWhereInput[] = [
    { chamado: { is: { responsavelId: sessao.id } } },
  ];

  if (sessao.setorId) {
    filtros.push({ chamado: { is: { setorId: sessao.setorId } } });
  }

  return { OR: filtros };
}

function dataIso(data: Date | null): string | null {
  return data?.toISOString() ?? null;
}

function mapearMensagemConversa(mensagem: {
  id: string;
  remetente: string | null;
  mensagem: string;
  origem: MensagemConversaResumo["origem"];
  assuntoIdentificado: string | null;
  confianca: number | null;
  criadoEm: Date;
}): MensagemConversaResumo {
  return {
    id: mensagem.id,
    remetente: mensagem.remetente,
    mensagem: mensagem.mensagem,
    origem: mensagem.origem,
    assuntoIdentificado: mensagem.assuntoIdentificado,
    confianca: mensagem.confianca,
    criadoEm: mensagem.criadoEm.toISOString(),
  };
}

function mapearConversaAtendimento(
  sessao: SessaoWhatsappComChamado,
  mensagens: MensagemConversaResumo[],
): ConversaAtendimentoResumo {
  return {
    id: sessao.id,
    telefoneCliente: sessao.telefoneCliente,
    estado: sessao.estado,
    primeiraMensagemEm: sessao.primeiraMensagemEm.toISOString(),
    ultimaInteracaoEm: sessao.ultimaInteracaoEm.toISOString(),
    ultimaRespostaHumanaEm: dataIso(sessao.ultimaRespostaHumanaEm),
    finalizadoEm: dataIso(sessao.finalizadoEm),
    expiraEm: sessao.expiraEm.toISOString(),
    protocoloEnviadoEm: dataIso(sessao.protocoloEnviadoEm),
    chamado: sessao.chamado
      ? {
          id: sessao.chamado.id,
          protocolo: sessao.chamado.protocolo,
          titulo: sessao.chamado.titulo,
          assunto: sessao.chamado.assunto,
          setor: sessao.chamado.setor,
          responsavel: sessao.chamado.responsavel,
        }
      : null,
    mensagens,
  };
}

/**
 * Lista sessões de conversa do WhatsApp respeitando o perfil autenticado.
 */
export async function listarConversasAtendimento(sessao: SessaoUsuario): Promise<ConversaAtendimentoResumo[]> {
  const sessoes = await prisma.sessaoWhatsapp.findMany({
    where: montarWhereSessoesWhatsapp(sessao),
    include: includeSessaoWhatsapp,
    orderBy: { ultimaInteracaoEm: "desc" },
    take: LIMITE_CONVERSAS,
  });
  const chamadosIds = sessoes
    .map((item) => item.chamadoId)
    .filter((chamadoId): chamadoId is string => Boolean(chamadoId));
  const mensagens = chamadosIds.length > 0
    ? await prisma.conversa.findMany({
        where: { chamadoId: { in: chamadosIds } },
        orderBy: { criadoEm: "asc" },
        take: LIMITE_CONVERSAS * LIMITE_MENSAGENS_POR_CONVERSA,
      })
    : [];
  const mensagensPorChamado = new Map<string, MensagemConversaResumo[]>();

  for (const mensagem of mensagens) {
    if (!mensagem.chamadoId) {
      continue;
    }

    const agrupadas = mensagensPorChamado.get(mensagem.chamadoId) ?? [];
    agrupadas.push(mapearMensagemConversa(mensagem));
    mensagensPorChamado.set(mensagem.chamadoId, agrupadas.slice(-LIMITE_MENSAGENS_POR_CONVERSA));
  }

  return sessoes.map((sessaoWhatsapp) => {
    const mensagensSessao = sessaoWhatsapp.chamadoId
      ? mensagensPorChamado.get(sessaoWhatsapp.chamadoId) ?? []
      : [];

    return mapearConversaAtendimento(sessaoWhatsapp, mensagensSessao);
  });
}

/**
 * Finaliza uma sessão de WhatsApp para impedir novos encerramentos no sistema.
 */
export async function finalizarConversaWhatsapp(
  sessaoWhatsappId: string,
  sessao: SessaoUsuario,
): Promise<ResultadoAcao<{ id: string; finalizadoEm: string }>> {
  if (sessao.perfil !== "ADMINISTRADOR") {
    return { sucesso: false, mensagem: "Você não possui permissão." };
  }

  const atual = await prisma.sessaoWhatsapp.findUnique({
    where: { id: sessaoWhatsappId },
    select: { id: true, finalizadoEm: true },
  });

  if (!atual) {
    return { sucesso: false, mensagem: "Conversa não encontrada." };
  }

  if (atual.finalizadoEm) {
    return { sucesso: false, mensagem: "Conversa já finalizada." };
  }

  const agora = new Date();
  const atualizacao = await prisma.sessaoWhatsapp.updateMany({
    where: { id: sessaoWhatsappId, finalizadoEm: null },
    data: {
      finalizadoEm: agora,
      estado: "EXPIRADA",
      expiraEm: agora,
      ultimaInteracaoEm: agora,
    },
  });

  if (atualizacao.count === 0) {
    return { sucesso: false, mensagem: "Conversa já finalizada." };
  }

  logInfo("finalizarConversaWhatsapp", { sessaoWhatsappId, actorId: sessao.id });

  return { sucesso: true, dados: { id: sessaoWhatsappId, finalizadoEm: agora.toISOString() } };
}
