"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ConversaAtendimentoResumo } from "../../types/conversa";
import type { SessaoUsuario } from "../../types/usuario";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { EstadoVazio } from "../components/estado_vazio";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type ConversaViewProps = {
  conversas: ConversaAtendimentoResumo[];
  perfil: SessaoUsuario["perfil"];
};

type RespostaApi<T> =
  | {
      sucesso: true;
      dados: T;
    }
  | {
      sucesso: false;
      mensagem: string;
    };

function formatarData(valor: string | null): string {
  if (!valor) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function textoEstado(conversa: ConversaAtendimentoResumo): string {
  if (conversa.finalizadoEm) {
    return "Finalizada";
  }

  if (conversa.estado === "AGUARDANDO_DADOS") {
    return "Aguardando dados";
  }

  if (conversa.estado === "CHAMADO_CRIADO") {
    return "Chamado criado";
  }

  if (conversa.estado === "EM_ATENDIMENTO") {
    return "Em atendimento";
  }

  return "Expirada";
}

export function ConversaView({ conversas, perfil }: ConversaViewProps) {
  const router = useRouter();
  const [finalizandoId, setFinalizandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const podeFinalizar = perfil === "ADMINISTRADOR";

  async function finalizarConversa(id: string): Promise<void> {
    setFinalizandoId(id);
    setErro(null);

    const response = await fetch(`/api/conversas/${id}/finalizar`, { method: "POST" });
    const data = (await response.json()) as RespostaApi<{ id: string; finalizadoEm: string }>;

    setFinalizandoId(null);

    if (!data.sucesso) {
      setErro(data.mensagem);
      return;
    }

    router.refresh();
  }

  return (
    <section>
      <CabecalhoPagina
        titulo="Conversas"
        descricao="Histórico real de conversas recebidas pelo WhatsApp e vinculadas aos chamados."
      />

      {erro ? <p className="mb-4 rounded-[18px] bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}

      {conversas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma conversa encontrada"
          descricao="As conversas aparecerão aqui quando o WhatsApp receber mensagens e criar sessões de atendimento."
        />
      ) : (
        <div className="grid gap-4">
          {conversas.map((conversa) => (
            <article key={conversa.id} className="rounded-[32px] bg-snow p-5 ring-1 ring-fog">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{conversa.telefoneCliente}</h2>
                    <Badge variant={conversa.finalizadoEm ? "outline" : "default"}>{textoEstado(conversa)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-steel">
                    Última interação: {formatarData(conversa.ultimaInteracaoEm)}
                  </p>
                </div>

                {podeFinalizar ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-snow"
                    disabled={Boolean(conversa.finalizadoEm) || finalizandoId === conversa.id}
                    onClick={() => void finalizarConversa(conversa.id)}
                  >
                    {conversa.finalizadoEm
                      ? "Conversa finalizada"
                      : finalizandoId === conversa.id
                        ? "Finalizando..."
                        : "Finalizar conversa"}
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 rounded-[24px] bg-mist p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-steel">Chamado</p>
                  <p className="mt-1 font-semibold text-ink">
                    {conversa.chamado?.protocolo ?? conversa.chamado?.id ?? "Sem chamado vinculado"}
                  </p>
                  <p className="text-sm text-steel">{conversa.chamado?.titulo ?? "Aguardando abertura"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-steel">Setor</p>
                  <p className="mt-1 font-semibold text-ink">{conversa.chamado?.setor.nome ?? "Não classificado"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-steel">Responsável</p>
                  <p className="mt-1 font-semibold text-ink">{conversa.chamado?.responsavel?.nome ?? "Sem responsável"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <p className="text-sm font-semibold text-ink">Mensagens</p>
                {conversa.mensagens.length === 0 ? (
                  <p className="rounded-[18px] bg-mist px-3 py-2 text-sm text-steel">
                    Nenhuma mensagem vinculada ao chamado desta sessão.
                  </p>
                ) : (
                  conversa.mensagens.map((mensagem) => (
                    <div key={mensagem.id} className="rounded-[18px] bg-mist px-3 py-2">
                      <div className="flex flex-wrap justify-between gap-2 text-xs text-steel">
                        <span>{mensagem.remetente ?? "Remetente não informado"}</span>
                        <span>{formatarData(mensagem.criadoEm)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{mensagem.mensagem}</p>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
