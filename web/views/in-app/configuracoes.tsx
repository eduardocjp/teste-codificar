"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  LABEL_ORIGEM,
  ORIGENS_CHAMADO,
  PRIORIDADES,
  type OrigemChamadoValor,
  type PrioridadeValor,
} from "../../types/dominio";
import type { SessaoUsuario } from "../../types/usuario";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type SetorOpcao = {
  id: string;
  nome: string;
};

type IntencaoLista = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  assuntoSugerido: string;
  palavrasChave: string[];
  exemplos: string[];
  canais: string[];
  ativo: boolean;
  setorId: string;
  setor: { id: string; nome: string };
  prioridadeSugerida: PrioridadeValor;
  confiancaMinima: number;
};

type ConfiguracoesViewProps = {
  intencoes: IntencaoLista[];
  setores: SetorOpcao[];
  perfil: SessaoUsuario["perfil"];
};

type EstadoFormularioIntencao = {
  id: string | null;
  nome: string;
  slug: string;
  descricao: string;
  assuntoSugerido: string;
  palavrasChave: string;
  exemplos: string;
  canais: OrigemChamadoValor[];
  prioridadeSugerida: PrioridadeValor;
  confiancaMinima: string;
  ativo: boolean;
  setorId: string;
};

type RespostaApi<T> = {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
};

const estadoVazio: EstadoFormularioIntencao = {
  id: null,
  nome: "",
  slug: "",
  descricao: "",
  assuntoSugerido: "",
  palavrasChave: "",
  exemplos: "",
  canais: [...ORIGENS_CHAMADO],
  prioridadeSugerida: "MEDIA",
  confiancaMinima: "55",
  ativo: true,
  setorId: "",
};

function gerarSlug(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dividirLista(valor: string): string[] {
  return valor
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ehOrigemChamado(valor: string): valor is OrigemChamadoValor {
  return ORIGENS_CHAMADO.includes(valor as OrigemChamadoValor);
}

function normalizarCanais(canais: string[]): OrigemChamadoValor[] {
  const canaisValidos = canais.filter(ehOrigemChamado);

  return canaisValidos.length > 0 ? canaisValidos : [...ORIGENS_CHAMADO];
}

function montarEstadoEdicao(intencao: IntencaoLista): EstadoFormularioIntencao {
  return {
    id: intencao.id,
    nome: intencao.nome,
    slug: intencao.slug,
    descricao: intencao.descricao ?? "",
    assuntoSugerido: intencao.assuntoSugerido,
    palavrasChave: intencao.palavrasChave.join(", "),
    exemplos: intencao.exemplos.join("\n"),
    canais: normalizarCanais(intencao.canais),
    prioridadeSugerida: intencao.prioridadeSugerida,
    confiancaMinima: String(Math.round(intencao.confiancaMinima * 100)),
    ativo: intencao.ativo,
    setorId: intencao.setorId,
  };
}

function textoCanais(canais: string[]): string {
  return normalizarCanais(canais).map((canal) => LABEL_ORIGEM[canal]).join(", ");
}

export function ConfiguracoesView({ intencoes, setores, perfil }: ConfiguracoesViewProps) {
  const router = useRouter();
  const podeEditarIntencoes = perfil === "ADMINISTRADOR";
  const [formulario, setFormulario] = useState<EstadoFormularioIntencao>({
    ...estadoVazio,
    setorId: setores[0]?.id ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const editando = Boolean(formulario.id);
  const intencoesOrdenadas = useMemo(
    () => [...intencoes].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome)),
    [intencoes],
  );

  function atualizar<K extends keyof EstadoFormularioIntencao>(campo: K, valor: EstadoFormularioIntencao[K]): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarNome(nome: string): void {
    setFormulario((atual) => ({
      ...atual,
      nome,
      slug: atual.id || atual.slug ? atual.slug : gerarSlug(nome),
    }));
  }

  function alternarCanal(canal: OrigemChamadoValor): void {
    setFormulario((atual) => {
      const possui = atual.canais.includes(canal);
      const canais = possui ? atual.canais.filter((item) => item !== canal) : [...atual.canais, canal];

      return { ...atual, canais: canais.length > 0 ? canais : [canal] };
    });
  }

  function limparFormulario(): void {
    setFormulario({ ...estadoVazio, setorId: setores[0]?.id ?? "" });
    setErro(null);
    setSucesso(null);
  }

  function editarIntencao(intencao: IntencaoLista): void {
    if (!podeEditarIntencoes) {
      return;
    }

    setFormulario(montarEstadoEdicao(intencao));
    setErro(null);
    setSucesso(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(null);

    const payload = {
      nome: formulario.nome,
      slug: formulario.slug,
      descricao: formulario.descricao || null,
      assuntoSugerido: formulario.assuntoSugerido,
      palavrasChave: dividirLista(formulario.palavrasChave),
      exemplos: dividirLista(formulario.exemplos),
      canais: formulario.canais,
      prioridadeSugerida: formulario.prioridadeSugerida,
      confiancaMinima: Number(formulario.confiancaMinima) / 100,
      ativo: podeEditarIntencoes ? formulario.ativo : true,
      setorId: formulario.setorId,
    };

    const url = formulario.id ? `/api/intencoes/${formulario.id}` : "/api/intencoes";
    const response = await fetch(url, {
      method: formulario.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as RespostaApi<{ id: string }>;

    setSalvando(false);

    if (!data.sucesso) {
      setErro(data.mensagem ?? "Não foi possível salvar a intenção.");
      return;
    }

    setSucesso(formulario.id ? "Intenção atualizada." : "Intenção criada.");
    limparFormulario();
    router.refresh();
  }

  async function alternarAtivo(intencao: IntencaoLista): Promise<void> {
    if (!podeEditarIntencoes) {
      return;
    }

    setErro(null);
    setSucesso(null);

    const response = await fetch(`/api/intencoes/${intencao.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !intencao.ativo }),
    });
    const data = (await response.json()) as RespostaApi<{ id: string }>;

    if (!data.sucesso) {
      setErro(data.mensagem ?? "Não foi possível alterar o status da intenção.");
      return;
    }

    setSucesso(intencao.ativo ? "Intenção desativada." : "Intenção ativada.");
    router.refresh();
  }

  async function excluir(intencao: IntencaoLista): Promise<void> {
    if (!podeEditarIntencoes) {
      return;
    }

    const confirmar = window.confirm(`Excluir a intenção "${intencao.nome}"?`);

    if (!confirmar) {
      return;
    }

    setErro(null);
    setSucesso(null);

    const response = await fetch(`/api/intencoes/${intencao.id}`, { method: "DELETE" });
    const data = (await response.json()) as RespostaApi<{ id: string }>;

    if (!data.sucesso) {
      setErro(data.mensagem ?? "Não foi possível excluir a intenção.");
      return;
    }

    if (formulario.id === intencao.id) {
      limparFormulario();
    }

    setSucesso("Intenção excluída.");
    router.refresh();
  }

  return (
    <section>
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Crie e consulte as intenções usadas pelo Intent Solver para classificar chamados."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={salvar} className="grid gap-4 rounded-[36px] bg-snow p-5 ring-1 ring-fog">
          <div>
            <p className="text-xs font-medium uppercase text-steel">{editando ? "Editar intent" : "Novo intent"}</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {editando ? "Atualizar intenção" : "Criar nova intenção"}
            </h2>
            {!podeEditarIntencoes ? (
              <p className="mt-2 text-sm text-steel">
                Atendentes podem criar e visualizar intents. Edição, exclusão e status ficam restritos ao administrador.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formulario.nome}
                onChange={(evento) => atualizarNome(evento.target.value)}
                className="mt-2 h-10 rounded-[14px]"
                placeholder="Problema com acesso"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formulario.slug}
                onChange={(evento) => atualizar("slug", gerarSlug(evento.target.value))}
                className="mt-2 h-10 rounded-[14px]"
                placeholder="problema-acesso"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formulario.descricao}
                onChange={(evento) => atualizar("descricao", evento.target.value)}
                className="mt-2 min-h-20 rounded-[18px]"
                placeholder="Explique quando essa intenção deve ser usada."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="assuntoSugerido">Assunto sugerido</Label>
              <Input
                id="assuntoSugerido"
                value={formulario.assuntoSugerido}
                onChange={(evento) => atualizar("assuntoSugerido", evento.target.value)}
                className="mt-2 h-10 rounded-[14px]"
                placeholder="Acesso bloqueado"
                required
              />
            </div>
            <div>
              <Label htmlFor="setorId">Setor de destino</Label>
              <select
                id="setorId"
                value={formulario.setorId}
                onChange={(evento) => atualizar("setorId", evento.target.value)}
                className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm"
                required
              >
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="prioridadeSugerida">Prioridade sugerida</Label>
              <select
                id="prioridadeSugerida"
                value={formulario.prioridadeSugerida}
                onChange={(evento) => atualizar("prioridadeSugerida", evento.target.value as PrioridadeValor)}
                className="mt-2 h-10 w-full rounded-[14px] border border-input bg-transparent px-3 text-sm"
              >
                {PRIORIDADES.map((prioridade) => (
                  <option key={prioridade} value={prioridade}>
                    {prioridade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="confiancaMinima">Confiança mínima (%)</Label>
              <Input
                id="confiancaMinima"
                type="number"
                min={0}
                max={100}
                value={formulario.confiancaMinima}
                onChange={(evento) => atualizar("confiancaMinima", evento.target.value)}
                className="mt-2 h-10 rounded-[14px]"
                required
              />
            </div>
            {podeEditarIntencoes ? (
              <div className="flex items-end">
                <label className="flex h-10 w-full items-center gap-2 rounded-[14px] border border-input px-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(evento) => atualizar("ativo", evento.target.checked)}
                    className="size-4"
                  />
                  Intent ativa
                </label>
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Label htmlFor="palavrasChave">Palavras que o sistema deve entender</Label>
              <Textarea
                id="palavrasChave"
                value={formulario.palavrasChave}
                onChange={(evento) => atualizar("palavrasChave", evento.target.value)}
                className="mt-2 min-h-24 rounded-[18px]"
                placeholder="login, senha, acesso bloqueado"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="exemplos">Exemplos de mensagens</Label>
              <Textarea
                id="exemplos"
                value={formulario.exemplos}
                onChange={(evento) => atualizar("exemplos", evento.target.value)}
                className="mt-2 min-h-24 rounded-[18px]"
                placeholder="Não consigo acessar o sistema&#10;Minha senha está bloqueada"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink">Canais onde a intent será usada</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ORIGENS_CHAMADO.map((canal) => {
                const ativo = formulario.canais.includes(canal);

                return (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => alternarCanal(canal)}
                    className={`rounded-full px-3 py-2 text-sm font-medium ${
                      ativo ? "bg-obsidian text-snow" : "bg-mist text-steel"
                    }`}
                  >
                    {LABEL_ORIGEM[canal]}
                  </button>
                );
              })}
            </div>
          </div>

          {erro ? <p className="rounded-[18px] bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}
          {sucesso ? <p className="rounded-[18px] bg-mist px-3 py-2 text-sm text-ink">{sucesso}</p> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={salvando} className="rounded-full bg-obsidian text-snow shadow-subtle">
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar intent"}
            </Button>
            {editando && podeEditarIntencoes ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={limparFormulario}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>

        <div className="rounded-[36px] bg-snow p-5 ring-1 ring-fog">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">Intenções cadastradas</h2>
            <span className="rounded-full bg-mist px-3 py-1 text-xs text-steel">{intencoesOrdenadas.length} intents</span>
          </div>
          <div className="mt-4 grid gap-3">
            {intencoesOrdenadas.map((intencao) => (
              <article key={intencao.id} className="rounded-[24px] bg-mist p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{intencao.nome}</h3>
                    <p className="text-xs text-steel">
                      {intencao.slug} · {intencao.setor.nome}
                    </p>
                  </div>
                  {podeEditarIntencoes ? (
                    <button
                      type="button"
                      onClick={() => void alternarAtivo(intencao)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        intencao.ativo ? "bg-obsidian text-snow" : "bg-snow text-steel ring-1 ring-fog"
                      }`}
                    >
                      {intencao.ativo ? "Ativa" : "Inativa"}
                    </button>
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        intencao.ativo ? "bg-obsidian text-snow" : "bg-snow text-steel ring-1 ring-fog"
                      }`}
                    >
                      {intencao.ativo ? "Ativa" : "Inativa"}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-steel">
                  Prioridade {intencao.prioridadeSugerida} · Confiança mínima{" "}
                  {Math.round(intencao.confiancaMinima * 100)}%
                </p>
                <p className="mt-1 text-xs text-steel">Canais: {textoCanais(intencao.canais)}</p>
                <p className="mt-3 line-clamp-2 text-sm text-steel">
                  Palavras: {intencao.palavrasChave.join(", ")}
                </p>
                {podeEditarIntencoes ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => editarIntencao(intencao)}>
                      Editar
                    </Button>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => void excluir(intencao)}>
                      Excluir
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
