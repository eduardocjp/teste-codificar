import { z } from "zod";

import { normalizarTelefoneWhatsapp } from "../services/servico_processamento_mensagem";
import { normalizarTexto } from "../utils/utils";

const schemaWebhookEvolution = z.object({
  event: z.string().optional(),
  instance: z.string().optional(),
  data: z.unknown().optional(),
}).passthrough();

export type MensagemEvolutionNormalizada = {
  tipo: "mensagem";
  evento: string;
  instancia: string | null;
  identificadorExterno: string;
  telefone: string;
  texto: string;
  fromMe: boolean;
  nomeRemetente: string | null;
};

export type ConexaoEvolutionNormalizada = {
  tipo: "conexao";
  evento: string;
  instancia: string | null;
  estado: "conectada" | "desconectada" | "conectando" | "erro";
  numeroConectado: string | null;
};

export type EventoEvolutionNormalizado =
  | MensagemEvolutionNormalizada
  | ConexaoEvolutionNormalizada
  | {
      tipo: "ignorado";
      evento: string;
      motivo: string;
    };

function isRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function buscarObjetoPorChave(valor: unknown, chave: string): Record<string, unknown> | null {
  if (isRecord(valor)) {
    const direto = valor[chave];

    if (isRecord(direto)) {
      return direto;
    }

    for (const item of Object.values(valor)) {
      const encontrado = buscarObjetoPorChave(item, chave);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = buscarObjetoPorChave(item, chave);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  return null;
}

function buscarStringPorChaves(valor: unknown, chaves: string[]): string | null {
  if (isRecord(valor)) {
    for (const chave of chaves) {
      const encontrado = valor[chave];

      if (typeof encontrado === "string" && encontrado.trim().length > 0) {
        return encontrado.trim();
      }
    }

    for (const item of Object.values(valor)) {
      const encontrado = buscarStringPorChaves(item, chaves);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = buscarStringPorChaves(item, chaves);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  return null;
}

function buscarBooleanPorChaves(valor: unknown, chaves: string[]): boolean | null {
  if (isRecord(valor)) {
    for (const chave of chaves) {
      const encontrado = valor[chave];

      if (typeof encontrado === "boolean") {
        return encontrado;
      }
    }

    for (const item of Object.values(valor)) {
      const encontrado = buscarBooleanPorChaves(item, chaves);

      if (encontrado !== null) {
        return encontrado;
      }
    }
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = buscarBooleanPorChaves(item, chaves);

      if (encontrado !== null) {
        return encontrado;
      }
    }
  }

  return null;
}

function extrairTextoMensagem(valor: unknown): string | null {
  return buscarStringPorChaves(valor, ["conversation", "text", "caption", "body"]);
}

function normalizarEstadoConexao(valor: string | null): ConexaoEvolutionNormalizada["estado"] {
  if (valor === "open" || valor === "connected" || valor === "conectada") {
    return "conectada";
  }

  if (valor === "connecting" || valor === "conectando") {
    return "conectando";
  }

  if (valor === "close" || valor === "closed" || valor === "disconnected" || valor === "desconectada") {
    return "desconectada";
  }

  return "erro";
}

/**
 * Valida e normaliza eventos da Evolution para o fluxo interno de WhatsApp.
 */
export function normalizarWebhookEvolution(payload: unknown): EventoEvolutionNormalizado {
  const validacao = schemaWebhookEvolution.safeParse(payload);

  if (!validacao.success) {
    return { tipo: "ignorado", evento: "payload_invalido", motivo: "Payload inválido." };
  }

  const dados = validacao.data.data ?? validacao.data;
  const evento = validacao.data.event ?? buscarStringPorChaves(payload, ["event", "type"]) ?? "evento_desconhecido";
  const eventoNormalizado = normalizarTexto(evento);
  const instancia = validacao.data.instance ?? buscarStringPorChaves(payload, ["instance", "instanceName"]);

  if (eventoNormalizado.includes("connection")) {
    const estadoBruto = buscarStringPorChaves(dados, ["state", "status", "connectionStatus"]);

    return {
      tipo: "conexao",
      evento,
      instancia,
      estado: normalizarEstadoConexao(estadoBruto),
      numeroConectado: normalizarTelefoneWhatsapp(buscarStringPorChaves(dados, ["owner", "number", "jid"])),
    };
  }

  const chaveMensagem = buscarObjetoPorChave(dados, "key");
  const identificadorExterno =
    (isRecord(chaveMensagem) && typeof chaveMensagem.id === "string" ? chaveMensagem.id : null)
    ?? buscarStringPorChaves(dados, ["messageId", "keyId", "id"]);
  const remoteJid =
    (isRecord(chaveMensagem) && typeof chaveMensagem.remoteJid === "string" ? chaveMensagem.remoteJid : null)
    ?? buscarStringPorChaves(dados, ["remoteJid", "jid", "from", "sender"]);
  const telefone = normalizarTelefoneWhatsapp(remoteJid);
  const texto = extrairTextoMensagem(dados);

  if (!identificadorExterno || !telefone || !texto) {
    return { tipo: "ignorado", evento, motivo: "Evento sem mensagem processável." };
  }

  return {
    tipo: "mensagem",
    evento,
    instancia,
    identificadorExterno,
    telefone,
    texto,
    fromMe: buscarBooleanPorChaves(chaveMensagem ?? dados, ["fromMe"]) ?? false,
    nomeRemetente: buscarStringPorChaves(dados, ["pushName", "senderName", "name"]),
  };
}
