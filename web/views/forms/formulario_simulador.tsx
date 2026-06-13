"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import type { ResultadoResolucaoIntencao } from "../../types/intencao";
import { ResultadoIntencao } from "../components/resultado_intencao";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type CanalSimulador = "EMAIL" | "WHATSAPP";

type ChamadoCriadoSimulador = {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  responsavel: { nome: string } | null;
};

type ResultadoCapturaFormulario = {
  canal: CanalSimulador;
  remetente: string;
  mensagemRecebida: string;
  assuntoExtraido: string;
  corpoExtraido: string;
  precisaRespostaEstruturada: boolean;
  respostaSolicitada: string | null;
  resultadoIntencao: ResultadoResolucaoIntencao;
  conversaId: string | null;
  chamado: ChamadoCriadoSimulador | null;
};

type RespostaCaptura = {
  sucesso: boolean;
  mensagem?: string;
  dados?: ResultadoCapturaFormulario;
};

export function FormularioSimulador() {
  const [canal, setCanal] = useState<CanalSimulador>("EMAIL");
  const [emailRemetente, setEmailRemetente] = useState("suporte@emailteste.com");
  const [emailAssunto, setEmailAssunto] = useState("Impressora sem toner");
  const [emailConteudo, setEmailConteudo] = useState("A impressora do setor fiscal está sem toner e ninguém consegue imprimir notas.");
  const [whatsappNome, setWhatsappNome] = useState("Maria Silva");
  const [whatsappNumero, setWhatsappNumero] = useState("5511999999999");
  const [whatsappMensagem, setWhatsappMensagem] = useState("Oi, meu notebook não liga desde cedo.");
  const [whatsappResposta, setWhatsappResposta] = useState("");
  const [criarChamado, setCriarChamado] = useState(true);
  const [resultado, setResultado] = useState<ResultadoCapturaFormulario | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const podeEnviar =
    canal === "EMAIL"
      ? emailRemetente.length > 4 && emailAssunto.length >= 3 && emailConteudo.length >= 10
      : whatsappNome.length >= 2 && whatsappNumero.length >= 8 && whatsappMensagem.length >= 5;

  async function simularCaptura(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setCarregando(true);
    setErro(null);

    const payload =
      canal === "EMAIL"
        ? {
            canal,
            remetente: emailRemetente,
            assunto: emailAssunto,
            conteudo: emailConteudo,
            criarChamado,
          }
        : {
            canal,
            nome: whatsappNome,
            numero: whatsappNumero,
            mensagem: whatsappMensagem,
            respostaEstruturada: whatsappResposta || undefined,
            criarChamado,
          };

    const response = await fetch("/api/simulador/captura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as RespostaCaptura;

    setCarregando(false);

    if (!data.sucesso || !data.dados) {
      setErro(data.mensagem ?? "Não foi possível processar a simulação.");
      return;
    }

    setResultado(data.dados);

    if (data.dados.precisaRespostaEstruturada && data.dados.respostaSolicitada) {
      setWhatsappResposta(data.dados.respostaSolicitada.replace("descreva o problema, impacto e local afetado.", ""));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={simularCaptura} className="grid gap-4 rounded-[36px] bg-snow p-5 ring-1 ring-fog">
        <div>
          <p className="text-xs font-medium uppercase text-steel">Entrada do usuário</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Enviar mensagem simulada</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-full bg-mist p-1">
          <button
            type="button"
            onClick={() => setCanal("EMAIL")}
            className={`rounded-full px-3 py-2 text-sm font-medium ${canal === "EMAIL" ? "bg-obsidian text-snow" : "text-steel"}`}
          >
            E-mail
          </button>
          <button
            type="button"
            onClick={() => setCanal("WHATSAPP")}
            className={`rounded-full px-3 py-2 text-sm font-medium ${canal === "WHATSAPP" ? "bg-obsidian text-snow" : "text-steel"}`}
          >
            WhatsApp
          </button>
        </div>

        {canal === "EMAIL" ? (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="emailRemetente">E-mail recebido</Label>
              <Input
                id="emailRemetente"
                value={emailRemetente}
                onChange={(evento) => setEmailRemetente(evento.target.value)}
                className="mt-2 h-10 rounded-[14px]"
                placeholder="suporte@emailteste.com"
              />
            </div>
            <div>
              <Label htmlFor="emailAssunto">Assunto</Label>
              <Input
                id="emailAssunto"
                value={emailAssunto}
                onChange={(evento) => setEmailAssunto(evento.target.value)}
                className="mt-2 h-10 rounded-[14px]"
              />
            </div>
            <div>
              <Label htmlFor="emailConteudo">Conteúdo / mensagem</Label>
              <Textarea
                id="emailConteudo"
                value={emailConteudo}
                onChange={(evento) => setEmailConteudo(evento.target.value)}
                className="mt-2 min-h-36 rounded-[18px]"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="whatsappNome">Nome capturado</Label>
                <Input
                  id="whatsappNome"
                  value={whatsappNome}
                  onChange={(evento) => setWhatsappNome(evento.target.value)}
                  className="mt-2 h-10 rounded-[14px]"
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumero">Número</Label>
                <Input
                  id="whatsappNumero"
                  value={whatsappNumero}
                  onChange={(evento) => setWhatsappNumero(evento.target.value)}
                  className="mt-2 h-10 rounded-[14px]"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsappMensagem">Mensagem inicial</Label>
              <Textarea
                id="whatsappMensagem"
                value={whatsappMensagem}
                onChange={(evento) => setWhatsappMensagem(evento.target.value)}
                className="mt-2 min-h-28 rounded-[18px]"
              />
            </div>
            <div>
              <Label htmlFor="whatsappResposta">Resposta estruturada do usuário</Label>
              <Textarea
                id="whatsappResposta"
                value={whatsappResposta}
                onChange={(evento) => setWhatsappResposta(evento.target.value)}
                className="mt-2 min-h-28 rounded-[18px]"
                placeholder="Assunto: Notebook não liga&#10;Mensagem: o notebook do financeiro não liga desde cedo."
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 rounded-[20px] bg-mist px-3 py-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={criarChamado}
            onChange={(evento) => setCriarChamado(evento.target.checked)}
            className="size-4"
          />
          Criar chamado automaticamente na simulação
        </label>

        {erro ? <p className="rounded-2xl bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}

        <Button type="submit" disabled={carregando || !podeEnviar} className="rounded-full bg-obsidian text-snow shadow-subtle">
          {carregando ? "Processando..." : "Simular captura"}
        </Button>
      </form>

      <aside className="rounded-[36px] bg-snow p-5 ring-1 ring-fog">
        <p className="text-xs font-medium uppercase text-steel">Recebimento interno</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Dados inseridos automaticamente</h2>

        {!resultado ? (
          <div className="mt-5 rounded-[28px] bg-mist p-5 text-sm text-steel">
            A simulação aparecerá aqui com assunto, corpo, classificação, conversa registrada e chamado criado.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <div className="rounded-[28px] bg-mist p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{resultado.canal === "EMAIL" ? "E-mail capturado" : "WhatsApp capturado"}</h3>
                <span className="rounded-full bg-snow px-2 py-1 text-xs text-graphite">{resultado.remetente}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs text-steel">Assunto extraído</dt>
                  <dd className="font-medium text-ink">{resultado.assuntoExtraido}</dd>
                </div>
                <div>
                  <dt className="text-xs text-steel">Corpo usado no chamado</dt>
                  <dd className="whitespace-pre-wrap text-steel">{resultado.corpoExtraido}</dd>
                </div>
              </dl>
            </div>

            {resultado.precisaRespostaEstruturada && resultado.respostaSolicitada ? (
              <div className="rounded-[28px] bg-obsidian p-4 text-snow">
                <h3 className="font-semibold">Resposta solicitada ao usuário</h3>
                <pre className="mt-3 whitespace-pre-wrap rounded-[18px] bg-ink p-3 text-sm text-snow">{resultado.respostaSolicitada}</pre>
              </div>
            ) : null}

            <ResultadoIntencao resultado={resultado.resultadoIntencao} />

            <div className="rounded-[28px] bg-mist p-4">
              <h3 className="font-semibold text-ink">Registro automático</h3>
              <p className="mt-2 text-sm text-steel">
                Conversa: {resultado.conversaId ?? "não registrada"}.
              </p>
              {resultado.chamado ? (
                <div className="mt-3 rounded-[20px] bg-snow p-3">
                  <p className="text-sm font-semibold text-ink">{resultado.chamado.titulo}</p>
                  <p className="mt-1 text-xs text-steel">
                    Status {resultado.chamado.status} · prioridade {resultado.chamado.prioridade} · responsável{" "}
                    {resultado.chamado.responsavel?.nome ?? "pendente"}
                  </p>
                  <Button asChild variant="outline" className="mt-3 rounded-full">
                    <Link href={`/chamados/${resultado.chamado.id}`}>Abrir chamado</Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-steel">
                  Nenhum chamado foi criado nesta etapa. No WhatsApp, preencha a resposta estruturada e simule novamente.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
