import { prisma } from "../lib/prisma";
import { normalizarWebhookEvolution, type MensagemEvolutionNormalizada } from "../messaging/schema_webhook_evolution";
import { analisarMensagemIntentSolver } from "../modules/intents/servico_intencao";
import { criarChamadoComDistribuicao } from "../modules/tickets/servico_chamado";
import type { ChamadoComRelacoes } from "../types/chamado";
import type { ResultadoAcao } from "../types/resultado";
import { logError, logInfo, logWarn } from "../utils/logger";
import { limitarTexto } from "../utils/utils";
import { marcarWhatsappConectado, marcarWhatsappDesconectado, obterConfiguracaoWhatsapp } from "./servico_configuracao_whatsapp";
import { enviarMensagemEvolution } from "./servico_evolution";
import {
  extrairSolicitacaoWhatsapp,
  MENSAGEM_ESTRUTURA_SOLICITACAO_WHATSAPP,
  MENSAGEM_INSTRUCAO_COPIA_WHATSAPP,
} from "./servico_processamento_mensagem";

const TEMPO_EXPIRACAO_COLETA_MS = 10 * 60 * 1000;
const TEMPO_EXPIRACAO_HUMANA_MS = 30 * 60 * 1000;
const TEMPO_AGENDAMENTO_PROTOCOLO_MS = 2 * 60 * 1000;

const MENSAGEM_SOLICITACAO_CORRECAO = [
  "Não consegui identificar todas as informações.",
  "",
  "Envie novamente em uma única mensagem, usando este formato:",
  "",
  MENSAGEM_ESTRUTURA_SOLICITACAO_WHATSAPP,
].join("\n");

type SessaoWhatsappAtiva = {
  id: string;
  telefoneCliente: string;
  estado: "AGUARDANDO_DADOS" | "CHAMADO_CRIADO" | "EM_ATENDIMENTO" | "EXPIRADA";
  chamadoId: string | null;
  expiraEm: Date;
  finalizadoEm: Date | null;
};

type ResultadoProcessamentoWhatsapp = {
  acao:
    | "ignorado"
    | "duplicado"
    | "conexao_atualizada"
    | "orientacao_enviada"
    | "correcao_enviada"
    | "chamado_criado"
    | "mensagem_anexada"
    | "resposta_humana";
  chamadoId?: string;
  protocolo?: string | null;
};

function calcularExpiracaoColeta(agora: Date): Date {
  return new Date(agora.getTime() + TEMPO_EXPIRACAO_COLETA_MS);
}

function calcularExpiracaoHumana(agora: Date): Date {
  return new Date(agora.getTime() + TEMPO_EXPIRACAO_HUMANA_MS);
}

function calcularAgendamentoProtocolo(agora: Date): Date {
  return new Date(agora.getTime() + TEMPO_AGENDAMENTO_PROTOCOLO_MS);
}

async function obterSessaoAtiva(telefone: string, agora: Date): Promise<SessaoWhatsappAtiva | null> {
  await prisma.sessaoWhatsapp.updateMany({
    where: {
      telefoneCliente: telefone,
      estado: { not: "EXPIRADA" },
      finalizadoEm: null,
      expiraEm: { lte: agora },
    },
    data: { estado: "EXPIRADA" },
  });

  return prisma.sessaoWhatsapp.findFirst({
    where: {
      telefoneCliente: telefone,
      estado: { not: "EXPIRADA" },
      finalizadoEm: null,
      expiraEm: { gt: agora },
    },
    orderBy: { ultimaInteracaoEm: "desc" },
    select: {
      id: true,
      telefoneCliente: true,
      estado: true,
      chamadoId: true,
      expiraEm: true,
      finalizadoEm: true,
    },
  });
}

async function mensagemJaRegistrada(identificadorExterno: string): Promise<boolean> {
  const conversa = await prisma.conversa.findUnique({
    where: { identificadorExterno },
    select: { id: true },
  });

  return Boolean(conversa);
}

async function registrarConversa(dados: {
  mensagem: MensagemEvolutionNormalizada;
  chamadoId?: string | null;
  assuntoIdentificado?: string | null;
  confianca?: number | null;
  intencaoId?: string | null;
  setorId?: string | null;
  remetente?: string | null;
}): Promise<void> {
  await prisma.conversa.create({
    data: {
      remetente: dados.remetente ?? dados.mensagem.nomeRemetente ?? dados.mensagem.telefone,
      mensagem: dados.mensagem.texto,
      origem: "WHATSAPP",
      identificadorExterno: dados.mensagem.identificadorExterno,
      assuntoIdentificado: dados.assuntoIdentificado ?? null,
      confianca: dados.confianca ?? null,
      intencaoId: dados.intencaoId ?? null,
      setorId: dados.setorId ?? null,
      chamadoId: dados.chamadoId ?? null,
    },
  });
}

async function enviarOrientacao(sessaoId: string, telefone: string, mensagemConfiguravel: string): Promise<void> {
  const primeiraMensagem = [
    mensagemConfiguravel.trim(),
    "",
    MENSAGEM_INSTRUCAO_COPIA_WHATSAPP,
  ].join("\n");
  const mensagens = [primeiraMensagem, MENSAGEM_ESTRUTURA_SOLICITACAO_WHATSAPP];

  for (const conteudo of mensagens) {
    const envio = await enviarMensagemEvolution({
      destinatario: telefone,
      conteudo,
      tipo: "ORIENTACAO_INICIAL",
      sessaoWhatsappId: sessaoId,
    });

    if (!envio.sucesso) {
      logWarn("enviarOrientacao.whatsapp", { motivo: envio.mensagem });
    }
  }
}

async function enviarCorrecao(sessaoId: string, telefone: string): Promise<void> {
  const envio = await enviarMensagemEvolution({
    destinatario: telefone,
    conteudo: MENSAGEM_SOLICITACAO_CORRECAO,
    tipo: "SOLICITACAO_CORRECAO",
    sessaoWhatsappId: sessaoId,
  });

  if (!envio.sucesso) {
    logWarn("enviarCorrecao.whatsapp", { motivo: envio.mensagem });
  }
}

async function enviarAvisoSuporte(dados: {
  numeroAviso: string | null;
  sessaoId: string;
  chamado: ChamadoComRelacoes;
  nome: string;
  telefone: string;
  assunto: string;
}): Promise<boolean> {
  if (!dados.numeroAviso) {
    return false;
  }

  const mensagem = [
    "Novo chamado criado pelo suporte via WhatsApp.",
    "",
    `Protocolo: ${dados.chamado.protocolo ?? dados.chamado.id}`,
    `Cliente: ${dados.nome}`,
    `Telefone: ${dados.telefone}`,
    `Assunto: ${dados.assunto}`,
    `Setor: ${dados.chamado.setor.nome}`,
  ].join("\n");
  const envio = await enviarMensagemEvolution({
    destinatario: dados.numeroAviso,
    conteudo: mensagem,
    tipo: "AVISO_SUPORTE",
    sessaoWhatsappId: dados.sessaoId,
    chamadoId: dados.chamado.id,
  });

  if (!envio.sucesso) {
    logWarn("enviarAvisoSuporte.whatsapp", { motivo: envio.mensagem, chamadoId: dados.chamado.id });
    return false;
  }

  return true;
}

async function processarPrimeiroContato(
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  const configuracao = await obterConfiguracaoWhatsapp();

  if (!configuracao.ativo || !configuracao.conectado) {
    return { sucesso: true, dados: { acao: "ignorado" } };
  }

  const sessao = await prisma.sessaoWhatsapp.create({
    data: {
      telefoneCliente: mensagem.telefone,
      estado: "AGUARDANDO_DADOS",
      primeiraMensagemEm: agora,
      ultimaInteracaoEm: agora,
      expiraEm: calcularExpiracaoColeta(agora),
    },
    select: { id: true },
  });

  await registrarConversa({ mensagem });
  await enviarOrientacao(sessao.id, mensagem.telefone, configuracao.mensagemPrimeiroContato);
  await prisma.sessaoWhatsapp.update({
    where: { id: sessao.id },
    data: { orientacaoEnviada: true },
  });

  return { sucesso: true, dados: { acao: "orientacao_enviada" } };
}

async function processarMensagemInvalida(
  sessao: SessaoWhatsappAtiva,
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  await registrarConversa({ mensagem, chamadoId: sessao.chamadoId });
  await enviarCorrecao(sessao.id, mensagem.telefone);
  await prisma.sessaoWhatsapp.update({
    where: { id: sessao.id },
    data: {
      ultimaInteracaoEm: agora,
      expiraEm: calcularExpiracaoColeta(agora),
    },
  });

  return { sucesso: true, dados: { acao: "correcao_enviada" } };
}

async function processarMensagemValida(
  sessao: SessaoWhatsappAtiva,
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  const campos = extrairSolicitacaoWhatsapp(mensagem.texto);

  if (!campos.valida) {
    return processarMensagemInvalida(sessao, mensagem, agora);
  }

  const analise = await analisarMensagemIntentSolver(`${campos.assunto}. ${campos.descricao}`, "WHATSAPP");

  if (!analise.sucesso) {
    return analise;
  }

  const chamado = await criarChamadoComDistribuicao({
    titulo: limitarTexto(campos.assunto, 150),
    descricao: campos.descricao,
    assunto: limitarTexto(campos.assunto, 150),
    solicitanteNome: campos.nome,
    solicitanteTelefone: mensagem.telefone,
    prioridade: analise.dados.prioridadeSugerida,
    status: "ABERTO",
    setorId: analise.dados.setorId,
    intencaoId: analise.dados.intencaoId ?? undefined,
    confiancaIntencao: analise.dados.confianca,
    origem: "WHATSAPP",
    atribuicaoAutomatica: true,
  });

  if (!chamado.sucesso) {
    return chamado;
  }

  await registrarConversa({
    mensagem,
    chamadoId: chamado.dados.id,
    assuntoIdentificado: analise.dados.assuntoSugerido,
    confianca: analise.dados.confianca,
    intencaoId: analise.dados.intencaoId,
    setorId: analise.dados.setorId,
  });

  const protocoloAgendadoPara = calcularAgendamentoProtocolo(agora);
  await prisma.sessaoWhatsapp.update({
    where: { id: sessao.id },
    data: {
      estado: "CHAMADO_CRIADO",
      chamadoId: chamado.dados.id,
      ultimaInteracaoEm: agora,
      protocoloAgendadoPara,
      expiraEm: new Date(protocoloAgendadoPara.getTime() + TEMPO_EXPIRACAO_COLETA_MS),
    },
  });

  const configuracao = await obterConfiguracaoWhatsapp();
  const avisoEnviado = await enviarAvisoSuporte({
    numeroAviso: configuracao.numeroAviso,
    sessaoId: sessao.id,
    chamado: chamado.dados,
    nome: campos.nome,
    telefone: mensagem.telefone,
    assunto: campos.assunto,
  });

  if (avisoEnviado) {
    await prisma.sessaoWhatsapp.update({
      where: { id: sessao.id },
      data: { avisoSuporteEnviado: true },
    });
  }

  return {
    sucesso: true,
    dados: {
      acao: "chamado_criado",
      chamadoId: chamado.dados.id,
      protocolo: chamado.dados.protocolo,
    },
  };
}

async function processarMensagemDuranteSessao(
  sessao: SessaoWhatsappAtiva,
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  await registrarConversa({ mensagem, chamadoId: sessao.chamadoId });
  await prisma.sessaoWhatsapp.update({
    where: { id: sessao.id },
    data: {
      ultimaInteracaoEm: agora,
      expiraEm: sessao.estado === "EM_ATENDIMENTO" ? calcularExpiracaoHumana(agora) : sessao.expiraEm,
    },
  });

  return { sucesso: true, dados: { acao: "mensagem_anexada", chamadoId: sessao.chamadoId ?? undefined } };
}

async function processarRespostaHumana(
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  const envioAutomatico = await prisma.envioAutomaticoWhatsapp.findFirst({
    where: { identificadorExterno: mensagem.identificadorExterno },
    select: { id: true },
  });

  if (envioAutomatico) {
    return { sucesso: true, dados: { acao: "ignorado" } };
  }

  if (await mensagemJaRegistrada(mensagem.identificadorExterno)) {
    return { sucesso: true, dados: { acao: "duplicado" } };
  }

  const sessao = await obterSessaoAtiva(mensagem.telefone, agora);

  if (!sessao) {
    return { sucesso: true, dados: { acao: "ignorado" } };
  }

  await registrarConversa({
    mensagem,
    chamadoId: sessao.chamadoId,
    remetente: "Atendimento",
  });
  await prisma.sessaoWhatsapp.update({
    where: { id: sessao.id },
    data: {
      estado: "EM_ATENDIMENTO",
      ultimaInteracaoEm: agora,
      ultimaRespostaHumanaEm: agora,
      expiraEm: calcularExpiracaoHumana(agora),
    },
  });

  return { sucesso: true, dados: { acao: "resposta_humana", chamadoId: sessao.chamadoId ?? undefined } };
}

async function processarMensagemEntrada(
  mensagem: MensagemEvolutionNormalizada,
  agora: Date,
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  if (await mensagemJaRegistrada(mensagem.identificadorExterno)) {
    return { sucesso: true, dados: { acao: "duplicado" } };
  }

  const sessao = await obterSessaoAtiva(mensagem.telefone, agora);

  if (!sessao) {
    return processarPrimeiroContato(mensagem, agora);
  }

  if (sessao.estado === "AGUARDANDO_DADOS") {
    return processarMensagemValida(sessao, mensagem, agora);
  }

  return processarMensagemDuranteSessao(sessao, mensagem, agora);
}

/**
 * Processa evento da Evolution para abertura automática e acompanhamento de chamados por WhatsApp.
 */
export async function processarWebhookWhatsapp(
  payload: unknown,
  agora = new Date(),
): Promise<ResultadoAcao<ResultadoProcessamentoWhatsapp>> {
  const evento = normalizarWebhookEvolution(payload);

  if (evento.tipo === "ignorado") {
    logInfo("processarWebhookWhatsapp.ignorado", { evento: evento.evento, motivo: evento.motivo });
    return { sucesso: true, dados: { acao: "ignorado" } };
  }

  if (evento.tipo === "conexao") {
    if (evento.estado === "conectada") {
      await marcarWhatsappConectado(evento.numeroConectado);
    }

    if (evento.estado === "desconectada") {
      await marcarWhatsappDesconectado();
    }

    return { sucesso: true, dados: { acao: "conexao_atualizada" } };
  }

  try {
    return await (evento.fromMe ? processarRespostaHumana(evento, agora) : processarMensagemEntrada(evento, agora));
  } catch (erro) {
    logError("processarWebhookWhatsapp", erro);
    return { sucesso: false, mensagem: "Não foi possível processar a mensagem do WhatsApp." };
  }
}
