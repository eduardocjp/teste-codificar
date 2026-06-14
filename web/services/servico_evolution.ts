import { obterEnv } from "../lib/env";
import type { ResultadoAcao } from "../types/resultado";

const INSTANCIA_PADRAO = "teste_cod_01";
const EVENTOS_WEBHOOK = ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"] as const;

type ConfiguracaoEvolution = {
  apiUrl: string;
  apiChave: string;
  instanciaNome: string;
  webhookUrl: string;
  webhookSegredo: string | null;
};

export type EstadoEvolution = "desconectada" | "conectando" | "conectada" | "erro";

export type DadosConexaoEvolution = {
  instanciaNome: string;
  estado: EstadoEvolution;
  qrcodeBase64: string | null;
  codigoPareamento: string | null;
  webhookUrl: string;
  mensagem: string;
};

function isRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim().length > 0 ? valor : null;
}

function normalizarBase64Imagem(valor: string | null): string | null {
  if (!valor) {
    return null;
  }

  if (valor.startsWith("data:image/")) {
    return valor;
  }

  if (valor.length > 100 && /^[A-Za-z0-9+/=]+$/.test(valor)) {
    return `data:image/png;base64,${valor}`;
  }

  return null;
}

function buscarValorPorChave(valor: unknown, chaves: string[]): string | null {
  if (isRecord(valor)) {
    for (const chave of chaves) {
      const encontrado = textoOuNulo(valor[chave]);

      if (encontrado) {
        return encontrado;
      }
    }

    for (const item of Object.values(valor)) {
      const encontrado = buscarValorPorChave(item, chaves);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const encontrado = buscarValorPorChave(item, chaves);

      if (encontrado) {
        return encontrado;
      }
    }
  }

  return null;
}

function extrairEstado(valor: unknown): EstadoEvolution {
  const estado = buscarValorPorChave(valor, ["state", "connectionStatus", "status"]);

  if (estado === "open") {
    return "conectada";
  }

  if (estado === "connecting") {
    return "conectando";
  }

  if (estado === "close" || estado === "closed" || estado === "disconnected") {
    return "desconectada";
  }

  return "erro";
}

function extrairQrCode(valor: unknown): string | null {
  return normalizarBase64Imagem(buscarValorPorChave(valor, ["base64", "qrCode", "qrcode"]));
}

function extrairCodigoPareamento(valor: unknown): string | null {
  return buscarValorPorChave(valor, ["pairingCode", "code"]);
}

function obterConfiguracaoEvolution(): ResultadoAcao<ConfiguracaoEvolution> {
  const env = obterEnv();

  if (env.EVOLUTION_API_HABILITADA !== "true") {
    return { sucesso: false, mensagem: "Integração Evolution API desabilitada." };
  }

  const apiUrl = env.EVOLUTION_API_URL?.trim().replace(/\/+$/, "");
  const apiChave = env.EVOLUTION_API_CHAVE?.trim();
  const webhookUrl = env.EVOLUTION_WEBHOOK_URL?.trim();

  if (!apiUrl || !apiChave || !webhookUrl) {
    return {
      sucesso: false,
      mensagem: "Configure EVOLUTION_API_URL, EVOLUTION_API_CHAVE e EVOLUTION_WEBHOOK_URL no .env.",
    };
  }

  return {
    sucesso: true,
    dados: {
      apiUrl,
      apiChave,
      instanciaNome: env.EVOLUTION_API_INSTANCIA?.trim() || INSTANCIA_PADRAO,
      webhookUrl,
      webhookSegredo: env.EVOLUTION_WEBHOOK_SEGREDO?.trim() || null,
    },
  };
}

async function lerJsonResposta(response: Response): Promise<unknown> {
  const texto = await response.text();

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return texto;
  }
}

async function chamarEvolution(
  configuracao: ConfiguracaoEvolution,
  caminho: string,
  init?: RequestInit,
): Promise<{ ok: true; dados: unknown } | { ok: false; status: number; dados: unknown }> {
  const response = await fetch(`${configuracao.apiUrl}${caminho}`, {
    ...init,
    headers: {
      apikey: configuracao.apiChave,
      "Content-Type": "application/json",
    },
  });
  const dados = await lerJsonResposta(response);

  if (!response.ok) {
    return { ok: false, status: response.status, dados };
  }

  return { ok: true, dados };
}

function montarWebhook(configuracao: ConfiguracaoEvolution) {
  return {
    enabled: true,
    url: configuracao.webhookUrl,
    byEvents: false,
    base64: false,
    headers: configuracao.webhookSegredo ? { "x-webhook-secret": configuracao.webhookSegredo } : {},
    events: [...EVENTOS_WEBHOOK],
  };
}

async function configurarWebhook(configuracao: ConfiguracaoEvolution): Promise<ResultadoAcao<{ ok: true }>> {
  const resposta = await chamarEvolution(configuracao, `/webhook/set/${configuracao.instanciaNome}`, {
    method: "POST",
    body: JSON.stringify({ webhook: montarWebhook(configuracao) }),
  });

  if (!resposta.ok) {
    return {
      sucesso: false,
      mensagem: "Instância criada, mas não foi possível configurar o webhook da Evolution.",
    };
  }

  return { sucesso: true, dados: { ok: true } };
}

async function consultarEstado(configuracao: ConfiguracaoEvolution): Promise<EstadoEvolution> {
  const resposta = await chamarEvolution(configuracao, `/instance/connectionState/${configuracao.instanciaNome}`, {
    method: "GET",
  });

  if (!resposta.ok) {
    return "desconectada";
  }

  return extrairEstado(resposta.dados);
}

/**
 * Consulta a instância única configurada para WhatsApp.
 */
export async function obterStatusEvolution(): Promise<ResultadoAcao<DadosConexaoEvolution>> {
  const configuracao = obterConfiguracaoEvolution();

  if (!configuracao.sucesso) {
    return configuracao;
  }

  const estado = await consultarEstado(configuracao.dados);

  return {
    sucesso: true,
    dados: {
      instanciaNome: configuracao.dados.instanciaNome,
      estado,
      qrcodeBase64: null,
      codigoPareamento: null,
      webhookUrl: configuracao.dados.webhookUrl,
      mensagem: estado === "conectada" ? "WhatsApp conectado." : "Instância pronta para conexão.",
    },
  };
}

/**
 * Cria a instância única na Evolution, configura webhook e retorna QR Code de conexão.
 */
export async function conectarEvolution(): Promise<ResultadoAcao<DadosConexaoEvolution>> {
  const configuracao = obterConfiguracaoEvolution();

  if (!configuracao.sucesso) {
    return configuracao;
  }

  const payloadCriacao = {
    instanceName: configuracao.dados.instanciaNome,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    webhook: montarWebhook(configuracao.dados),
  };
  const criacao = await chamarEvolution(configuracao.dados, "/instance/create", {
    method: "POST",
    body: JSON.stringify(payloadCriacao),
  });
  const respostaQr = criacao.ok
    ? criacao
    : await chamarEvolution(configuracao.dados, `/instance/connect/${configuracao.dados.instanciaNome}`, {
        method: "GET",
      });

  if (!respostaQr.ok) {
    return {
      sucesso: false,
      mensagem: "Não foi possível criar ou conectar a instância na Evolution API.",
    };
  }

  const webhook = await configurarWebhook(configuracao.dados);

  if (!webhook.sucesso) {
    return webhook;
  }

  const estado = extrairEstado(respostaQr.dados);
  const qrcodeBase64 = extrairQrCode(respostaQr.dados);

  return {
    sucesso: true,
    dados: {
      instanciaNome: configuracao.dados.instanciaNome,
      estado: estado === "erro" ? "conectando" : estado,
      qrcodeBase64,
      codigoPareamento: extrairCodigoPareamento(respostaQr.dados),
      webhookUrl: configuracao.dados.webhookUrl,
      mensagem: qrcodeBase64
        ? "QR Code gerado pela Evolution API."
        : "Instância criada. A Evolution não retornou imagem de QR Code nesta resposta.",
    },
  };
}

/**
 * Remove a instância única da Evolution ao desconectar o canal.
 */
export async function desconectarEvolution(): Promise<ResultadoAcao<DadosConexaoEvolution>> {
  const configuracao = obterConfiguracaoEvolution();

  if (!configuracao.sucesso) {
    return configuracao;
  }

  const resposta = await chamarEvolution(configuracao.dados, `/instance/delete/${configuracao.dados.instanciaNome}`, {
    method: "DELETE",
  });

  if (!resposta.ok && resposta.status !== 404) {
    return { sucesso: false, mensagem: "Não foi possível excluir a instância na Evolution API." };
  }

  return {
    sucesso: true,
    dados: {
      instanciaNome: configuracao.dados.instanciaNome,
      estado: "desconectada",
      qrcodeBase64: null,
      codigoPareamento: null,
      webhookUrl: configuracao.dados.webhookUrl,
      mensagem: "Instância excluída da Evolution API.",
    },
  };
}
