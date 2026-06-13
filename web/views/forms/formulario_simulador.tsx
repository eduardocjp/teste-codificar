"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { ResultadoResolucaoIntencao } from "../../types/intencao";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ResultadoIntencao } from "../components/resultado_intencao";

export function FormularioSimulador() {
  const router = useRouter();
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<ResultadoResolucaoIntencao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function analisar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setCarregando(true);
    setErro(null);

    const response = await fetch("/api/intent-solver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem }),
    });
    const data = (await response.json()) as {
      sucesso: boolean;
      mensagem?: string;
      dados?: ResultadoResolucaoIntencao;
    };

    setCarregando(false);

    if (!data.sucesso || !data.dados) {
      setErro(data.mensagem ?? "Não foi possível analisar a mensagem.");
      return;
    }

    setResultado(data.dados);
  }

  function abrirChamadoPreenchido(): void {
    const params = new URLSearchParams({
      descricao: mensagem,
      titulo: resultado?.tituloSugerido ?? "",
      setorId: resultado?.setorId ?? "",
      prioridade: resultado?.prioridadeSugerida ?? "MEDIA",
      assunto: resultado?.assuntoSugerido ?? "",
      intencaoId: resultado?.intencaoId ?? "",
      confiancaIntencao: String(resultado?.confianca ?? ""),
    });

    router.push(`/chamados/novo?${params.toString()}`);
  }

  return (
    <form onSubmit={analisar} className="grid gap-4 rounded-[36px] bg-snow p-5 ring-1 ring-fog">
      <div>
        <Label htmlFor="mensagem">Mensagem para análise</Label>
        <Textarea
          id="mensagem"
          value={mensagem}
          onChange={(evento) => setMensagem(evento.target.value)}
          placeholder="Ex.: a impressora do setor fiscal está sem toner"
          className="mt-2 min-h-36 rounded-[18px]"
        />
      </div>
      {erro ? <p className="rounded-2xl bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={carregando || mensagem.length < 5} className="rounded-full bg-obsidian text-snow shadow-subtle">
          {carregando ? "Analisando..." : "Analisar"}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" disabled={!resultado} onClick={abrirChamadoPreenchido}>
          Abrir chamado preenchido
        </Button>
      </div>
      <ResultadoIntencao resultado={resultado} />
    </form>
  );
}
