import { prisma } from "../lib/prisma";
import type { ResultadoAcao } from "../types/resultado";
import { logWarn } from "../utils/logger";
import { enviarMensagemEvolution } from "./servico_evolution";

const TEMPO_JANELA_APOS_PROTOCOLO_MS = 10 * 60 * 1000;

type ResultadoAgendamentoWhatsapp = {
  processados: number;
  enviados: number;
  falhas: number;
};

function montarMensagemProtocolo(dados: {
  protocolo: string | null;
  assunto: string | null;
  setorNome: string;
}): string {
  return [
    "Seu chamado foi criado com sucesso.",
    "",
    `Protocolo: ${dados.protocolo ?? "em processamento"}`,
    `Assunto: ${dados.assunto ?? "Solicitação geral"}`,
    `Setor responsável: ${dados.setorNome}`,
    "",
    "Aguarde o atendimento da equipe de suporte.",
  ].join("\n");
}

/**
 * Processa confirmações de protocolo vencidas para sessões de WhatsApp.
 */
export async function processarAgendamentosWhatsapp(
  agora = new Date(),
  limite = 20,
): Promise<ResultadoAcao<ResultadoAgendamentoWhatsapp>> {
  const sessoes = await prisma.sessaoWhatsapp.findMany({
    where: {
      protocoloAgendadoPara: { lte: agora },
      protocoloEnviadoEm: null,
      chamadoId: { not: null },
      estado: { not: "EXPIRADA" },
    },
    include: {
      chamado: {
        select: {
          id: true,
          protocolo: true,
          assunto: true,
          setor: { select: { nome: true } },
        },
      },
    },
    orderBy: { protocoloAgendadoPara: "asc" },
    take: limite,
  });
  let enviados = 0;
  let falhas = 0;

  for (const sessao of sessoes) {
    if (!sessao.chamado) {
      falhas += 1;
      await prisma.sessaoWhatsapp.update({
        where: { id: sessao.id },
        data: {
          tentativasEnvio: { increment: 1 },
          ultimoErroEnvio: "Chamado associado não encontrado.",
        },
      });
      continue;
    }

    const conteudo = montarMensagemProtocolo({
      protocolo: sessao.chamado.protocolo,
      assunto: sessao.chamado.assunto,
      setorNome: sessao.chamado.setor.nome,
    });
    const envio = await enviarMensagemEvolution({
      destinatario: sessao.telefoneCliente,
      conteudo,
      tipo: "PROTOCOLO",
      sessaoWhatsappId: sessao.id,
      chamadoId: sessao.chamado.id,
    });

    if (!envio.sucesso) {
      falhas += 1;
      logWarn("processarAgendamentosWhatsapp.envio", { motivo: envio.mensagem, chamadoId: sessao.chamado.id });
      await prisma.sessaoWhatsapp.update({
        where: { id: sessao.id },
        data: {
          tentativasEnvio: { increment: 1 },
          ultimoErroEnvio: envio.mensagem,
        },
      });
      continue;
    }

    enviados += 1;
    await prisma.sessaoWhatsapp.update({
      where: { id: sessao.id },
      data: {
        protocoloEnviadoEm: agora,
        tentativasEnvio: { increment: 1 },
        ultimoErroEnvio: null,
        estado: "CHAMADO_CRIADO",
        expiraEm: new Date(agora.getTime() + TEMPO_JANELA_APOS_PROTOCOLO_MS),
      },
    });
  }

  return {
    sucesso: true,
    dados: {
      processados: sessoes.length,
      enviados,
      falhas,
    },
  };
}
