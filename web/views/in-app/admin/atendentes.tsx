"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Pencil, Plus, Trash2 } from "../../../utils/icons";
import { CabecalhoPagina } from "../../components/cabecalho_pagina";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

type SetorOpcao = {
  id: string;
  nome: string;
};

type AtendenteAdministracao = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  setorId: string | null;
  setor: { nome: string } | null;
  ultimaAtribuicao: Date | string | null;
  _count: { chamadosResponsaveis: number };
};

type EstadoFormulario = {
  id: string | null;
  nome: string;
  email: string;
  senha: string;
  setorId: string;
  ativo: boolean;
};

type RespostaApi<T> =
  | {
    sucesso: true;
    dados: T;
  }
  | {
    sucesso: false;
    mensagem: string;
    errosCampos?: Record<string, string[]>;
  };

type AdminAtendentesViewProps = {
  responsaveis: AtendenteAdministracao[];
  setores: SetorOpcao[];
};

function criarEstadoInicial(setores: SetorOpcao[]): EstadoFormulario {
  return {
    id: null,
    nome: "",
    email: "",
    senha: "",
    setorId: setores[0]?.id ?? "",
    ativo: true,
  };
}

function formatarData(valor: Date | string | null): string {
  if (!valor) {
    return "Sem atribuição";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

async function lerResposta(response: Response): Promise<RespostaApi<{ id: string }>> {
  return (await response.json()) as RespostaApi<{ id: string }>;
}

export function AdminAtendentesView({ responsaveis, setores }: AdminAtendentesViewProps) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<EstadoFormulario>(() => criarEstadoInicial(setores));
  const [carregando, setCarregando] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string[]>>({});

  const editando = Boolean(formulario.id);

  function limparFeedback(): void {
    setMensagem(null);
    setErro(null);
    setErrosCampos({});
  }

  function atualizarCampo(campo: keyof EstadoFormulario, valor: string | boolean | null): void {
    setFormulario((estadoAtual) => ({ ...estadoAtual, [campo]: valor }));
  }

  function iniciarCriacao(): void {
    limparFeedback();
    setFormulario(criarEstadoInicial(setores));
  }

  function iniciarEdicao(responsavel: AtendenteAdministracao): void {
    limparFeedback();
    setFormulario({
      id: responsavel.id,
      nome: responsavel.nome,
      email: responsavel.email,
      senha: "",
      setorId: responsavel.setorId ?? setores[0]?.id ?? "",
      ativo: responsavel.ativo,
    });
  }

  async function salvarAtendente(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    limparFeedback();

    if (!formulario.setorId) {
      setErro("Cadastre ou selecione um setor ativo antes de salvar o atendente.");
      return;
    }

    if (!editando && formulario.senha.trim().length === 0) {
      setErro("Informe a senha inicial do atendente.");
      setErrosCampos({ senha: ["Informe a senha inicial do atendente."] });
      return;
    }

    setCarregando(true);

    const payloadBase = {
      nome: formulario.nome,
      email: formulario.email,
      perfil: "ATENDENTE",
      setorId: formulario.setorId,
      ativo: formulario.ativo,
    };
    const payload = editando && formulario.senha.trim().length === 0
      ? payloadBase
      : { ...payloadBase, senha: formulario.senha };
    const response = await fetch(editando ? `/api/responsaveis/${formulario.id}` : "/api/responsaveis", {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const resultado = await lerResposta(response);

    setCarregando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      setErrosCampos(resultado.errosCampos ?? {});
      return;
    }

    setMensagem(editando ? "Atendente atualizado com sucesso." : "Atendente criado com sucesso.");
    setFormulario(criarEstadoInicial(setores));
    router.refresh();
  }

  async function alternarAtivo(responsavel: AtendenteAdministracao): Promise<void> {
    limparFeedback();
    setAcaoEmAndamento(responsavel.id);

    const response = await fetch(`/api/responsaveis/${responsavel.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !responsavel.ativo }),
    });
    const resultado = await lerResposta(response);

    setAcaoEmAndamento(null);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      setErrosCampos(resultado.errosCampos ?? {});
      return;
    }

    setMensagem(responsavel.ativo ? "Atendente desativado com sucesso." : "Atendente ativado com sucesso.");
    router.refresh();
  }

  async function excluirAtendente(responsavel: AtendenteAdministracao): Promise<void> {
    limparFeedback();

    if (!window.confirm(`Excluir o atendente ${responsavel.nome}?`)) {
      return;
    }

    setAcaoEmAndamento(responsavel.id);

    const response = await fetch(`/api/responsaveis/${responsavel.id}`, { method: "DELETE" });
    const resultado = await lerResposta(response);

    setAcaoEmAndamento(null);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      return;
    }

    setMensagem("Atendente excluído com sucesso.");
    router.refresh();
  }

  return (
    <section>
      <CabecalhoPagina
        titulo="Atendentes"
        descricao="Crie, edite, exclua e ative ou desative os atendentes disponíveis para distribuição de chamados."
        acao={
          <Button type="button" className="rounded-full bg-obsidian text-snow hover:bg-ink" onClick={iniciarCriacao}>
            <Plus />
            Novo atendente
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={salvarAtendente} className="rounded-[28px] bg-snow p-5 ring-1 ring-fog">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase text-steel">{editando ? "Editar atendente" : "Novo atendente"}</p>
            <h2 className="mt-1 text-xl font-semibold text-obsidian">
              {editando ? formulario.nome || "Atendente selecionado" : "Dados de acesso"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-steel">
              A senha é obrigatória na criação. Na edição, deixe em branco para manter a senha atual.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formulario.nome}
                onChange={(evento) => atualizarCampo("nome", evento.target.value)}
                placeholder="Ana Lima"
              />
              {errosCampos.nome ? <p className="text-xs text-red-600">{errosCampos.nome[0]}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formulario.email}
                onChange={(evento) => atualizarCampo("email", evento.target.value)}
                placeholder="ana@empresa.com"
              />
              {errosCampos.email ? <p className="text-xs text-red-600">{errosCampos.email[0]}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="senha">{editando ? "Nova senha" : "Senha inicial"}</Label>
              <Input
                id="senha"
                type="password"
                value={formulario.senha}
                onChange={(evento) => atualizarCampo("senha", evento.target.value)}
                placeholder={editando ? "Opcional" : "Mínimo de 6 caracteres"}
              />
              {errosCampos.senha ? <p className="text-xs text-red-600">{errosCampos.senha[0]}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label>Setor</Label>
              <Select value={formulario.setorId} onValueChange={(valor) => atualizarCampo("setorId", valor)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((setor) => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errosCampos.setorId ? <p className="text-xs text-red-600">{errosCampos.setorId[0]}</p> : null}
            </div>

            <label className="flex items-center gap-2 rounded-2xl bg-mist px-3 py-3 text-sm text-ink">
              <Checkbox checked={formulario.ativo} onCheckedChange={(checked) => atualizarCampo("ativo", checked === true)} />
              Atendente ativo
            </label>

            {erro ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}
            {mensagem ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{mensagem}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={carregando} className="rounded-full bg-obsidian text-snow hover:bg-ink">
                {carregando ? "Salvando..." : editando ? "Salvar alterações" : "Criar atendente"}
              </Button>
              {editando ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={iniciarCriacao}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="rounded-[28px] bg-snow p-5 ring-1 ring-fog">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-steel">Usuários atendentes</p>
              <h2 className="text-xl font-semibold text-obsidian">Atendentes cadastrados</h2>
            </div>
            <span className="text-sm text-steel">{responsaveis.length} registro(s)</span>
          </div>

          {responsaveis.length === 0 ? (
            <div className="rounded-[24px] bg-mist p-6 text-sm text-steel">
              Nenhum atendente cadastrado. Use o formulário para criar o primeiro atendente.
            </div>
          ) : (
            <div className="grid gap-3">
              {responsaveis.map((responsavel) => {
                const selecionado = formulario.id === responsavel.id;

                return (
                  <article
                    key={responsavel.id}
                    className={
                      selecionado
                        ? "rounded-[24px] bg-mist p-4 ring-2 ring-obsidian"
                        : "rounded-[24px] bg-mist p-4"
                    }
                  >
                    <div className="grid gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold leading-tight text-ink">{responsavel.nome}</h3>
                            {selecionado ? (
                              <span className="rounded-full bg-snow px-3 py-1 text-xs font-medium text-obsidian ring-1 ring-pebble">
                                Em edição
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 max-w-full break-words text-sm leading-5 text-steel">{responsavel.email}</p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full bg-snow"
                            onClick={() => iniciarEdicao(responsavel)}
                          >
                            <Pencil />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="rounded-full bg-snow"
                            disabled={acaoEmAndamento === responsavel.id}
                            onClick={() => excluirAtendente(responsavel)}
                          >
                            <Trash2 />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-[20px] bg-snow/70 p-3 text-sm sm:grid-cols-3">
                        <div className="flex min-w-0 flex-col items-start gap-1.5">
                          <p className="text-xs leading-none text-steel">Status</p>

                          <button
                            type="button"
                            disabled={acaoEmAndamento === responsavel.id}
                            onClick={() => alternarAtivo(responsavel)}
                            className={
                              responsavel.ativo
                                ? "rounded-full bg-obsidian px-3 py-1 text-xs font-medium leading-none text-snow"
                                : "rounded-full bg-fog px-3 py-1 text-xs font-medium leading-none text-steel ring-1 ring-pebble"
                            }
                          >
                            {responsavel.ativo ? "Ativo" : "Inativo"}
                          </button>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-steel">Setor</p>
                          <p className="break-words font-medium text-ink">
                            {responsavel.setor?.nome ?? "Sem setor"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-steel">Última atribuição</p>
                          <p className="font-medium text-ink">
                            {formatarData(responsavel.ultimaAtribuicao)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <p className="text-xs text-steel">Carga ativa de chamados em aberto</p>
                        <p className="text-3xl font-semibold leading-none text-obsidian">
                          {responsavel._count.chamadosResponsaveis}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
