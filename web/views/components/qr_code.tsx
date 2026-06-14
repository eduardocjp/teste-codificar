"use client";

import { useCallback, useEffect, useState } from "react";

import { QrCode } from "../../utils/icons";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";

type EstadoEvolution = "desconectada" | "conectando" | "conectada" | "erro";

type DadosConexaoEvolution = {
  instanciaNome: string;
  estado: EstadoEvolution;
  qrcodeBase64: string | null;
  codigoPareamento: string | null;
  mensagem: string;
  numeroConectado: string | null;
  qrExpiraEm: string | null;
  novaTentativaQrEm: string | null;
  bloqueadoPorRateLimit?: boolean;
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

type QrCodeConexaoProps = {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConectado: () => void;
};

function calcularSegundosRestantes(dataIso: string | null): number {
  if (!dataIso) {
    return 0;
  }

  return Math.max(0, Math.ceil((new Date(dataIso).getTime() - Date.now()) / 1000));
}

async function lerResposta<T>(response: Response): Promise<RespostaApi<T>> {
  return (await response.json()) as RespostaApi<T>;
}

/**
 * Exibe o QR Code de conexão solicitado ao backend da aplicação.
 */
export function QrCodeConexao({ aberto, onOpenChange, onConectado }: QrCodeConexaoProps) {
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<DadosConexaoEvolution | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [segundosQr, setSegundosQr] = useState(0);
  const [segundosBloqueio, setSegundosBloqueio] = useState(0);

  const consultarEstado = useCallback(async (): Promise<void> => {
    const response = await fetch("/api/whatsapp/estado", { method: "GET" });
    const resultado = await lerResposta<DadosConexaoEvolution>(response);

    if (!resultado.sucesso) {
      return;
    }

    if (resultado.dados.estado === "conectada") {
      setDados(resultado.dados);
      setMensagem("WhatsApp conectado com sucesso.");
      onConectado();
      onOpenChange(false);
    }
  }, [onConectado, onOpenChange]);

  const solicitarQrCode = useCallback(async (): Promise<void> => {
    setCarregando(true);
    setErro(null);
    setMensagem(null);

    const response = await fetch("/api/whatsapp/conectar", { method: "POST" });
    const resultado = await lerResposta<DadosConexaoEvolution>(response);
    setCarregando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      return;
    }

    setDados(resultado.dados);
    setMensagem(resultado.dados.mensagem);
    setSegundosQr(calcularSegundosRestantes(resultado.dados.qrExpiraEm));
    setSegundosBloqueio(calcularSegundosRestantes(resultado.dados.novaTentativaQrEm));
  }, []);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void solicitarQrCode();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [aberto, solicitarQrCode]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setSegundosQr(calcularSegundosRestantes(dados?.qrExpiraEm ?? null));
      setSegundosBloqueio(calcularSegundosRestantes(dados?.novaTentativaQrEm ?? null));
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [aberto, dados?.novaTentativaQrEm, dados?.qrExpiraEm]);

  useEffect(() => {
    if (!aberto || !dados?.qrcodeBase64 || segundosQr <= 0) {
      return;
    }

    const intervalo = window.setInterval(() => {
      void consultarEstado();
    }, 3000);

    return () => window.clearInterval(intervalo);
  }, [aberto, consultarEstado, dados?.qrcodeBase64, segundosQr]);

  useEffect(() => {
    if (!aberto || !dados?.qrcodeBase64 || segundosQr > 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMensagem("QR Code expirado. Aguarde a liberação de nova tentativa.");
      onOpenChange(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [aberto, dados?.qrcodeBase64, onOpenChange, segundosQr]);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] bg-snow p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-ink">Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Leia o QR Code com o WhatsApp. O código fica disponível por até 30 segundos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="rounded-[24px] bg-mist p-4">
            <div className="flex aspect-square w-full items-center justify-center rounded-[18px] bg-snow p-3 ring-1 ring-fog">
              {carregando ? (
                <Skeleton className="h-full w-full rounded-[18px]" />
              ) : dados?.qrcodeBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dados.qrcodeBase64} alt="QR Code da conexão WhatsApp" className="h-full w-full object-contain" />
              ) : (
                <div className="grid place-items-center gap-3 text-center text-sm text-steel">
                  <QrCode className="mx-auto size-12 text-obsidian" />
                  <span>{dados?.bloqueadoPorRateLimit ? "Nova tentativa bloqueada." : "Nenhum QR Code disponível."}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-mist p-4 text-sm text-steel">
            <p className="text-xs font-medium uppercase text-steel">Instância</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">{dados?.instanciaNome ?? "teste_cod_01"}</h3>
            <dl className="mt-4 grid gap-2">
              <div className="flex justify-between gap-3">
                <dt>Status</dt>
                <dd className="font-medium text-ink">{dados?.estado ?? "solicitando"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>QR expira em</dt>
                <dd className="font-medium text-ink">{segundosQr > 0 ? `${segundosQr}s` : "indisponível"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Nova tentativa</dt>
                <dd className="font-medium text-ink">
                  {segundosBloqueio > 0 ? `${segundosBloqueio}s` : "liberada"}
                </dd>
              </div>
            </dl>

            {mensagem ? <p className="mt-4 rounded-2xl bg-snow px-3 py-2 text-ink ring-1 ring-fog">{mensagem}</p> : null}
            {erro ? <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-red-700">{erro}</p> : null}
          </div>
        </div>

        <DialogFooter className="rounded-b-[28px]">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={carregando || segundosBloqueio > 0}
            onClick={() => void solicitarQrCode()}
          >
            Atualizar QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
