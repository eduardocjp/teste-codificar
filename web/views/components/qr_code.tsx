"use client";

import { useState } from "react";

import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { QrCode, Smartphone } from "../../utils/icons";

type EstadoEvolution = "desconectada" | "conectando" | "conectada" | "erro";

type DadosConexaoEvolution = {
    instanciaNome: string;
    estado: EstadoEvolution;
    qrcodeBase64: string | null;
    codigoPareamento: string | null;
    webhookUrl: string;
    mensagem: string;
};

type RespostaApi =
    | {
        sucesso: true;
        dados: DadosConexaoEvolution;
    }
    | {
        sucesso: false;
        mensagem: string;
    };

const LABEL_ESTADO: Record<EstadoEvolution, string> = {
    desconectada: "Desconectada",
    conectando: "Aguardando leitura",
    conectada: "Conectada",
    erro: "Erro",
};

async function lerResposta(response: Response): Promise<RespostaApi> {
    return (await response.json()) as RespostaApi;
}

/**
 * Exibe o modal de conexão WhatsApp usando QR Code real retornado pela Evolution API.
 */
export function QrCodeConexao() {
    const [aberto, setAberto] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [dados, setDados] = useState<DadosConexaoEvolution | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    async function executarRequisicao(method: "GET" | "POST" | "DELETE"): Promise<void> {
        setCarregando(true);
        setErro(null);

        const response = await fetch("/api/evolution/conexao", { method });
        const resultado = await lerResposta(response);

        setCarregando(false);

        if (!resultado.sucesso) {
            setErro(resultado.mensagem);
            return;
        }

        setDados(resultado.dados);
    }

    async function aoAbrirModal(proximoEstado: boolean): Promise<void> {
        setAberto(proximoEstado);

        if (proximoEstado && !dados) {
            await executarRequisicao("GET");
        }
    }

    return (
        <Dialog open={aberto} onOpenChange={(valor) => void aoAbrirModal(valor)}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-obsidian text-snow shadow-subtle">
                    <QrCode className="size-4" />
                    Configurar Whatsapp
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] bg-snow p-5 sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-ink">Conectar WhatsApp via Evolution</DialogTitle>
                    <DialogDescription>
                        Cria a instância única configurada no .env, registra o webhook e exibe o QR Code retornado pela Evolution.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                    <div className="rounded-[24px] bg-mist p-4">
                        <div className="flex aspect-square w-full items-center justify-center rounded-[18px] bg-snow p-3 ring-1 ring-fog">
                            {dados?.qrcodeBase64 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dados.qrcodeBase64} alt="QR Code da conexão WhatsApp" className="h-full w-full object-contain" />
                            ) : (
                                <div className="grid place-items-center gap-3 text-center text-sm text-steel">
                                    <QrCode className="mx-auto size-12 text-obsidian" />
                                    <span>{carregando ? "Buscando QR Code..." : "Clique em Atualizar QR Code."}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[24px] bg-mist p-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-obsidian text-snow">
                            <Smartphone className="size-5" />
                        </div>
                        <h3 className="mt-4 font-semibold text-ink">Instância Evolution</h3>
                        <p className="mt-2 text-sm leading-6 text-steel">
                            O fluxo usa apenas uma instância. Ao desconectar, a instância é excluída na Evolution API.
                        </p>
                        <dl className="mt-4 grid gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-steel">Instância</dt>
                                <dd className="font-medium text-ink">{dados?.instanciaNome ?? "teste_cod_01"}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-steel">Status</dt>
                                <dd className="font-medium text-ink">{dados ? LABEL_ESTADO[dados.estado] : "Não consultado"}</dd>
                            </div>
                        </dl>

                        {dados?.codigoPareamento && !dados.qrcodeBase64 ? (
                            <div className="mt-4 rounded-2xl bg-snow px-3 py-2 text-sm text-ink ring-1 ring-fog">
                                Código retornado: <strong>{dados.codigoPareamento}</strong>
                            </div>
                        ) : null}

                        {dados?.mensagem ? <p className="mt-4 text-sm text-steel">{dados.mensagem}</p> : null}
                        {erro ? <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}
                    </div>
                </div>

                <DialogFooter className="gap-2 rounded-b-[28px] sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        disabled={carregando}
                        onClick={() => void executarRequisicao("DELETE")}
                    >
                        Desconectar e excluir instância
                    </Button>
                    <Button
                        type="button"
                        className="rounded-full bg-obsidian text-snow"
                        disabled={carregando}
                        onClick={() => void executarRequisicao("POST")}
                    >
                        {carregando ? "Atualizando..." : "Atualizar QR Code"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
