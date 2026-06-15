"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { CheckCircle2, CircleAlert, QrCode, Smartphone } from "../../utils/icons";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { QrCodeConexao } from "./qr_code";

type DadosConfiguracaoWhatsapp = {
    ativo: boolean;
    conectado: boolean;
    numeroConectado: string | null;
    numeroAviso: string | null;
    mensagemPrimeiroContato: string;
    mensagemConfirmacaoChamado: string;
    novaTentativaQrEm: string | null;
    instanciaNome: string;
    apiHabilitada: boolean;
};

type DadosEstadoEvolution = {
    instanciaNome: string;
    estado: "desconectada" | "conectando" | "conectada" | "erro";
    numeroConectado: string | null;
    novaTentativaQrEm: string | null;
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

function textoStatus(configuracao: DadosConfiguracaoWhatsapp | null): string {
    if (!configuracao) {
        return "Carregando";
    }

    if (!configuracao.apiHabilitada) {
        return "Evolution desabilitada";
    }

    if (configuracao.conectado && configuracao.ativo) {
        return "Ativo e conectado";
    }

    if (configuracao.conectado) {
        return "Conectado e desativado";
    }

    if (configuracao.ativo) {
        return "Ativo e desconectado";
    }

    return "Desativado";
}

function formatarBloqueio(dataIso: string | null): string {
    if (!dataIso) {
        return "Nenhum bloqueio ativo.";
    }

    const data = new Date(dataIso);

    if (data.getTime() <= Date.now()) {
        return "Nova tentativa liberada.";
    }

    return `Nova tentativa liberada às ${data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })}.`;
}

async function lerResposta<T>(response: Response): Promise<RespostaApi<T>> {
    return (await response.json()) as RespostaApi<T>;
}

/**
 * Modal administrativo para configuração da automação de WhatsApp via Evolution.
 */
export function WhatsappConfig() {
    const [aberto, setAberto] = useState(false);
    const [qrAberto, setQrAberto] = useState(false);
    const [confirmarDesconexao, setConfirmarDesconexao] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [desconectando, setDesconectando] = useState(false);
    const [configuracao, setConfiguracao] = useState<DadosConfiguracaoWhatsapp | null>(null);
    const [ativo, setAtivo] = useState(false);
    const [numeroAviso, setNumeroAviso] = useState("");
    const [mensagemPrimeiroContato, setMensagemPrimeiroContato] = useState("");
    const [mensagemConfirmacaoChamado, setMensagemConfirmacaoChamado] = useState("");
    const [erro, setErro] = useState<string | null>(null);

    const sincronizarEstadoConfiguracao = useCallback(async (
        dadosBase: DadosConfiguracaoWhatsapp,
    ): Promise<DadosConfiguracaoWhatsapp> => {
        if (!dadosBase.apiHabilitada) {
            return dadosBase;
        }

        try {
            const responseEstado = await fetch("/api/whatsapp/estado", { method: "GET" });
            const resultadoEstado = await lerResposta<DadosEstadoEvolution>(responseEstado);

            if (!resultadoEstado.sucesso) {
                return dadosBase;
            }

            const conectado = resultadoEstado.dados.estado === "conectada";

            return {
                ...dadosBase,
                conectado,
                instanciaNome: resultadoEstado.dados.instanciaNome,
                numeroConectado: conectado
                    ? resultadoEstado.dados.numeroConectado ?? dadosBase.numeroConectado
                    : null,
                novaTentativaQrEm: resultadoEstado.dados.novaTentativaQrEm ?? dadosBase.novaTentativaQrEm,
            };
        } catch {
            setErro("Configuração carregada, mas não foi possível consultar a Evolution API.");
            return dadosBase;
        }
    }, []);

    const consultarEstadoAtual = useCallback(async (): Promise<void> => {
        if (!configuracao?.apiHabilitada) {
            return;
        }

        const dadosAtualizados = await sincronizarEstadoConfiguracao(configuracao);
        setConfiguracao(dadosAtualizados);
    }, [configuracao, sincronizarEstadoConfiguracao]);

    async function carregarConfiguracao(): Promise<void> {
        setCarregando(true);
        setErro(null);

        const response = await fetch("/api/whatsapp/configuracao", { method: "GET" });
        const resultado = await lerResposta<DadosConfiguracaoWhatsapp>(response);

        if (!resultado.sucesso) {
            setCarregando(false);
            setErro(resultado.mensagem);
            return;
        }

        const dadosAtualizados = await sincronizarEstadoConfiguracao(resultado.dados);

        setCarregando(false);
        setConfiguracao(dadosAtualizados);
        setAtivo(dadosAtualizados.ativo);
        setNumeroAviso(dadosAtualizados.numeroAviso ?? "");
        setMensagemPrimeiroContato(dadosAtualizados.mensagemPrimeiroContato);
        setMensagemConfirmacaoChamado(dadosAtualizados.mensagemConfirmacaoChamado);
    }

    useEffect(() => {
        if (!aberto || !configuracao?.apiHabilitada) {
            return;
        }

        const intervalo = window.setInterval(() => {
            void consultarEstadoAtual();
        }, 5000);

        return () => window.clearInterval(intervalo);
    }, [aberto, configuracao?.apiHabilitada, consultarEstadoAtual]);

    async function aoAbrirModal(proximoEstado: boolean): Promise<void> {
        setAberto(proximoEstado);

        if (proximoEstado) {
            await carregarConfiguracao();
        }
    }

    async function salvarConfiguracao(evento: FormEvent<HTMLFormElement>): Promise<void> {
        evento.preventDefault();
        setSalvando(true);
        setErro(null);

        const response = await fetch("/api/whatsapp/configuracao", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ativo,
                numeroAviso: numeroAviso.trim() || null,
                mensagemPrimeiroContato,
                mensagemConfirmacaoChamado,
            }),
        });
        const resultado = await lerResposta<DadosConfiguracaoWhatsapp>(response);
        setSalvando(false);

        if (!resultado.sucesso) {
            setErro(resultado.mensagem);
            toast.error(resultado.mensagem);
            return;
        }

        setConfiguracao(resultado.dados);
        setMensagemConfirmacaoChamado(resultado.dados.mensagemConfirmacaoChamado);
        toast.success("Configuração do WhatsApp salva.");
    }

    async function desconectarWhatsapp(): Promise<void> {
        setDesconectando(true);
        setErro(null);

        const response = await fetch("/api/whatsapp/desconectar", { method: "POST" });
        const resultado = await lerResposta<unknown>(response);
        setDesconectando(false);
        setConfirmarDesconexao(false);

        if (!resultado.sucesso) {
            setErro(resultado.mensagem);
            toast.error(resultado.mensagem);
            return;
        }

        toast.success("WhatsApp desconectado. Um novo QR Code será exigido na próxima conexão.");
        await carregarConfiguracao();
    }

    return (
        <>
            <Dialog open={aberto} onOpenChange={(valor) => void aoAbrirModal(valor)}>
                <DialogTrigger asChild>
                    <Button className="rounded-full bg-obsidian text-snow shadow-subtle">
                        <QrCode className="size-4" />
                        Configurar WhatsApp
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] bg-snow p-5 sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-ink">Configurar WhatsApp</DialogTitle>
                        <DialogDescription>
                            Controle a conexão via Evolution e a automação que cria chamados a partir de mensagens estruturadas.
                        </DialogDescription>
                    </DialogHeader>

                    {carregando ? (
                        <div className="grid gap-3">
                            <Skeleton className="h-24 rounded-[24px]" />
                            <Skeleton className="h-60 rounded-[24px]" />
                        </div>
                    ) : (
                        <form onSubmit={(evento) => void salvarConfiguracao(evento)} className="grid gap-4">
                            <div className="grid gap-3 rounded-[24px] bg-mist p-4 md:grid-cols-3">
                                <div>
                                    <p className="text-xs font-medium uppercase text-steel">Status</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        {configuracao?.conectado ? (
                                            <CheckCircle2 className="size-4 text-ink" />
                                        ) : (
                                            <CircleAlert className="size-4 text-steel" />
                                        )}
                                        <Badge variant={configuracao?.conectado ? "default" : "outline"}>{textoStatus(configuracao)}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase text-steel">Instância</p>
                                    <p className="mt-2 font-semibold text-ink">{configuracao?.instanciaNome ?? "teste_cod_01"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase text-steel">Número conectado</p>
                                    <p className="mt-2 font-semibold text-ink">{configuracao?.numeroConectado ?? "Não conectado"}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                                <div className="grid gap-4 rounded-[24px] bg-mist p-4">
                                    <div className="flex items-start gap-3 rounded-[18px] bg-snow p-3 ring-1 ring-fog">
                                        <Checkbox id="ativoWhatsapp" checked={ativo} onCheckedChange={(valor) => setAtivo(valor === true)} />
                                        <div>
                                            <Label htmlFor="ativoWhatsapp">Automação ativa</Label>
                                            <p className="mt-1 text-sm leading-6 text-steel">
                                                Desativar mantém a instância conectada, mas impede respostas automáticas e criação de chamados.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="numeroAviso">Número opcional para aviso interno</Label>
                                        <Input
                                            id="numeroAviso"
                                            value={numeroAviso}
                                            onChange={(evento) => setNumeroAviso(evento.target.value)}
                                            className="mt-2 h-10 rounded-[14px] bg-snow"
                                            placeholder="5511999999999"
                                        />
                                        <p className="mt-2 text-xs text-steel">
                                            Use esse número para avisar internamente que há cliente aguardando retorno no suporte.
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="mensagemPrimeiroContato">Mensagem de primeiro contato</Label>
                                        <Textarea
                                            id="mensagemPrimeiroContato"
                                            value={mensagemPrimeiroContato}
                                            onChange={(evento) => setMensagemPrimeiroContato(evento.target.value)}
                                            className="mt-2 min-h-40 rounded-[14px] bg-snow"
                                        />
                                        <p className="mt-2 text-xs text-steel">
                                            Esta mensagem é livre e será enviada antes da estrutura fixa obrigatória com nome, assunto e descrição.
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="mensagemConfirmacaoChamado">Mensagem de confirmação do chamado</Label>
                                        <Textarea
                                            id="mensagemConfirmacaoChamado"
                                            value={mensagemConfirmacaoChamado}
                                            onChange={(evento) => setMensagemConfirmacaoChamado(evento.target.value)}
                                            className="mt-2 min-h-36 rounded-[14px] bg-snow"
                                        />
                                        <p className="mt-2 text-xs text-steel">
                                            Use {"{protocolo}"}, {"{assunto}"} e {"{setor}"} para montar a resposta enviada ao cliente após a criação.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid content-start gap-3 rounded-[24px] bg-mist p-4 text-sm text-steel">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-obsidian text-snow">
                                        <Smartphone className="size-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-ink">Conexão</h3>
                                    <p>{formatarBloqueio(configuracao?.novaTentativaQrEm ?? null)}</p>
                                    <Button
                                        type="button"
                                        className="rounded-full bg-obsidian text-snow shadow-subtle"
                                        disabled={!configuracao?.apiHabilitada || configuracao?.conectado}
                                        onClick={() => setQrAberto(true)}
                                    >
                                        {configuracao?.conectado ? "Conectado" : "Conectar"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-full bg-snow"
                                        disabled={!configuracao?.conectado}
                                        onClick={() => setConfirmarDesconexao(true)}
                                    >
                                        Desconectar WhatsApp
                                    </Button>
                                </div>
                            </div>

                            {erro ? <p className="rounded-[18px] bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}

                            <DialogFooter className="rounded-b-[28px]">
                                <Button type="submit" className="rounded-full bg-obsidian text-snow shadow-subtle" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar configuração"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <QrCodeConexao aberto={qrAberto} onOpenChange={setQrAberto} onConectado={() => void carregarConfiguracao()} />

            <AlertDialog open={confirmarDesconexao} onOpenChange={setConfirmarDesconexao}>
                <AlertDialogContent className="rounded-[24px] bg-snow">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A instância será encerrada na Evolution. Os chamados, conversas e históricos existentes serão mantidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-full bg-obsidian text-snow"
                            disabled={desconectando}
                            onClick={(evento) => {
                                evento.preventDefault();
                                void desconectarWhatsapp();
                            }}
                        >
                            {desconectando ? "Desconectando..." : "Desconectar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
