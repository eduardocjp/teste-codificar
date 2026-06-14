"use client";

import { useState, type FormEvent } from "react";

import { Mail } from "../../utils/icons";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

/**
 * Exibe o modal visual de configuração do e-mail que receberá chamados.
 */
export function ConectarEmail() {
    const [emailRecebimento, setEmailRecebimento] = useState("suporte@emailteste.com");
    const [nomeCaixa, setNomeCaixa] = useState("Suporte interno");
    const [servidor, setServidor] = useState("imap.emailteste.com");
    const [porta, setPorta] = useState("993");
    const [emailResposta, setEmailResposta] = useState("respostas@emailteste.com");
    const [mensagem, setMensagem] = useState<string | null>(null);

    function salvarVisual(evento: FormEvent<HTMLFormElement>): void {
        evento.preventDefault();
        setMensagem("Configuração visual preparada. Nenhuma conexão externa foi executada.");
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full bg-snow">
                    <Mail className="size-4" />
                    Configurar e-mail
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] bg-snow p-5 sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-ink">Conectar e-mail de chamados</DialogTitle>
                    <DialogDescription>
                        Estrutura visual para o administrador informar a caixa que receberá solicitações por e-mail.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={salvarVisual} className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="emailRecebimento">E-mail de recebimento</Label>
                            <Input
                                id="emailRecebimento"
                                value={emailRecebimento}
                                onChange={(evento) => setEmailRecebimento(evento.target.value)}
                                className="mt-2 h-10 rounded-[14px]"
                                placeholder="suporte@emailteste.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="nomeCaixa">Nome da caixa</Label>
                            <Input
                                id="nomeCaixa"
                                value={nomeCaixa}
                                onChange={(evento) => setNomeCaixa(evento.target.value)}
                                className="mt-2 h-10 rounded-[14px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="emailResposta">E-mail para respostas</Label>
                            <Input
                                id="emailResposta"
                                value={emailResposta}
                                onChange={(evento) => setEmailResposta(evento.target.value)}
                                className="mt-2 h-10 rounded-[14px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="servidor">Servidor IMAP</Label>
                            <Input
                                id="servidor"
                                value={servidor}
                                onChange={(evento) => setServidor(evento.target.value)}
                                className="mt-2 h-10 rounded-[14px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="porta">Porta</Label>
                            <Input
                                id="porta"
                                value={porta}
                                onChange={(evento) => setPorta(evento.target.value)}
                                className="mt-2 h-10 rounded-[14px]"
                            />
                        </div>
                    </div>

                    <div className="rounded-[24px] bg-mist p-4 text-sm text-steel">
                        O fluxo real deverá ler assunto e corpo do e-mail, aplicar o Intent Solver e criar um chamado com origem
                        E-mail. Esta tela ainda não salva credenciais nem executa IMAP/SMTP.
                    </div>

                    {mensagem ? <p className="rounded-[18px] bg-fog px-3 py-2 text-sm text-ink">{mensagem}</p> : null}

                    <DialogFooter className="rounded-b-[28px]">
                        <Button type="submit" className="rounded-full bg-obsidian text-snow shadow-subtle">
                            Salvar configuração visual
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
