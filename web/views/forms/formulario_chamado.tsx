"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { ChamadoComRelacoes } from "../../types/chamado";
import type { PrioridadeValor, StatusChamadoValor } from "../../types/dominio";
import type { ResultadoResolucaoIntencao } from "../../types/intencao";
import { PRIORIDADES, STATUS_CHAMADO } from "../../types/dominio";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ResultadoIntencao } from "../components/resultado_intencao";

type SetorOpcao = {
  id: string;
  nome: string;
};

type ResponsavelOpcao = {
  id: string;
  nome: string;
  setorId: string | null;
};

type FormularioChamadoProps = {
  setores: SetorOpcao[];
  responsaveis: ResponsavelOpcao[];
  chamado?: ChamadoComRelacoes;
};

type EstadoFormulario = {
  titulo: string;
  descricao: string;
  assunto: string;
  prioridade: PrioridadeValor;
  status: StatusChamadoValor;
  setorId: string;
  responsavelId: string;
  atribuicaoAutomatica: boolean;
};

function estadoInicial(chamado: ChamadoComRelacoes | undefined, setores: SetorOpcao[]): EstadoFormulario {
  return {
    titulo: chamado?.titulo ?? "",
    descricao: chamado?.descricao ?? "",
    assunto: chamado?.assunto ?? "",
    prioridade: chamado?.prioridade ?? "MEDIA",
    status: chamado?.status ?? "ABERTO",
    setorId: chamado?.setorId ?? setores[0]?.id ?? "",
    responsavelId: chamado?.responsavelId ?? "",
    atribuicaoAutomatica: false,
  };
}

export function FormularioChamado({ setores, responsaveis, chamado }: FormularioChamadoProps) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<EstadoFormulario>(() => estadoInicial(chamado, setores));
  const [resultado, setResultado] = useState<ResultadoResolucaoIntencao | null>(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const responsaveisFiltrados = useMemo(
    () => responsaveis.filter((responsavel) => responsavel.setorId === formulario.setorId),
    [formulario.setorId, responsaveis],
  );

  function atualizar<K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function analisarSolicitacao(): Promise<void> {
    setCarregandoAnalise(true);
    setErro(null);

    const response = await fetch("/api/intent-solver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: formulario.descricao }),
    });
    const data = (await response.json()) as {
      sucesso: boolean;
      mensagem?: string;
      dados?: ResultadoResolucaoIntencao;
    };

    setCarregandoAnalise(false);

    if (!data.sucesso || !data.dados) {
      setErro(data.mensagem ?? "Não foi possível analisar a solicitação.");
      return;
    }

    setResultado(data.dados);
    setFormulario((atual) => ({
      ...atual,
      titulo: atual.titulo || data.dados?.tituloSugerido || "",
      assunto: data.dados?.assuntoSugerido ?? atual.assunto,
      prioridade: data.dados?.prioridadeSugerida ?? atual.prioridade,
      setorId: data.dados?.setorId ?? atual.setorId,
      responsavelId: "",
    }));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    const payload = {
      titulo: formulario.titulo,
      descricao: formulario.descricao,
      assunto: formulario.assunto || undefined,
      prioridade: formulario.prioridade,
      status: formulario.status,
      setorId: formulario.setorId,
      responsavelId: formulario.atribuicaoAutomatica ? undefined : formulario.responsavelId || undefined,
      atribuicaoAutomatica: formulario.atribuicaoAutomatica,
      intencaoId: resultado?.intencaoId ?? chamado?.intencaoId ?? undefined,
      confiancaIntencao: resultado?.confianca ?? chamado?.confiancaIntencao ?? undefined,
      origem: chamado?.origem ?? "MANUAL",
    };

    const response = await fetch(chamado ? `/api/chamados/${chamado.id}` : "/api/chamados", {
      method: chamado ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { sucesso: boolean; mensagem?: string; dados?: { id: string } };

    setSalvando(false);

    if (!data.sucesso) {
      setErro(data.mensagem ?? "Não foi possível salvar o chamado.");
      return;
    }

    router.push(data.dados?.id ? `/chamados/${data.dados.id}` : "/chamados");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="grid gap-4 rounded-[36px] bg-snow p-5 ring-1 ring-fog sm:p-6">
      <div>
        <Label htmlFor="descricao">Descrição da solicitação</Label>
        <Textarea
          id="descricao"
          value={formulario.descricao}
          onChange={(evento) => atualizar("descricao", evento.target.value)}
          required
          className="mt-2 min-h-32 rounded-[18px] bg-snow"
          placeholder="Ex.: meu notebook não liga desde cedo"
        />
        <Button
          type="button"
          onClick={analisarSolicitacao}
          disabled={carregandoAnalise || formulario.descricao.length < 5}
          className="mt-3 rounded-full bg-obsidian text-snow shadow-subtle"
        >
          {carregandoAnalise ? "Analisando..." : "Analisar solicitação"}
        </Button>
      </div>

      <ResultadoIntencao resultado={resultado} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" value={formulario.titulo} onChange={(evento) => atualizar("titulo", evento.target.value)} required className="mt-2 h-10 rounded-[14px]" />
        </div>
        <div>
          <Label htmlFor="assunto">Assunto</Label>
          <Input id="assunto" value={formulario.assunto} onChange={(evento) => atualizar("assunto", evento.target.value)} className="mt-2 h-10 rounded-[14px]" />
        </div>
        <div>
          <Label htmlFor="setorId">Setor</Label>
          <select id="setorId" value={formulario.setorId} onChange={(evento) => atualizar("setorId", evento.target.value)} required className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm">
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="prioridade">Prioridade</Label>
          <select id="prioridade" value={formulario.prioridade} onChange={(evento) => atualizar("prioridade", evento.target.value as PrioridadeValor)} className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm">
            {PRIORIDADES.map((prioridade) => (
              <option key={prioridade} value={prioridade}>
                {prioridade}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" value={formulario.status} onChange={(evento) => atualizar("status", evento.target.value as StatusChamadoValor)} className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm">
            {STATUS_CHAMADO.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <input
              id="atribuicaoAutomatica"
              type="checkbox"
              checked={formulario.atribuicaoAutomatica}
              onChange={(evento) => atualizar("atribuicaoAutomatica", evento.target.checked)}
              className="size-4"
            />
            <Label htmlFor="atribuicaoAutomatica">Atribuir automaticamente ao atendente com menor carga</Label>
          </div>
        </div>
        {!formulario.atribuicaoAutomatica ? (
          <div className="md:col-span-2">
            <Label htmlFor="responsavelId">Responsável</Label>
            <select id="responsavelId" value={formulario.responsavelId} onChange={(evento) => atualizar("responsavelId", evento.target.value)} className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm">
              <option value="">Sem responsável</option>
              {responsaveisFiltrados.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {erro ? <p className="rounded-2xl bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={salvando} className="rounded-full bg-obsidian text-snow shadow-subtle">
          {salvando ? "Salvando..." : chamado ? "Salvar alterações" : "Criar chamado"}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => router.push("/chamados")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
