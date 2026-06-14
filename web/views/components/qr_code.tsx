"use client";

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

const matrizQrVisual = [
  "111111101001001111111",
  "100000101111001000001",
  "101110101000101011101",
  "101110101101001011101",
  "101110101011101011101",
  "100000101010101000001",
  "111111101010101111111",
  "000000001111100000000",
  "111010111001111010101",
  "001101001101001111010",
  "110011111010111001101",
  "011100001111000101011",
  "101011111000111111001",
  "000000001011010010110",
  "111111101110101011101",
  "100000101001111010001",
  "101110101111001011101",
  "101110101000111000101",
  "101110101101001011101",
  "100000101011101000001",
  "111111101010111111111",
] as const;

/**
 * Exibe o modal visual de conexão WhatsApp preparado para QR Code da Evolution.
 */
export function QrCodeConexao() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-obsidian text-snow shadow-subtle">
          <QrCode className="size-4" />
          Conectar WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[28px] bg-snow p-5 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-ink">Conectar WhatsApp via Evolution</DialogTitle>
          <DialogDescription>
            Estrutura visual para leitura do QR Code. A integração real com a Evolution API permanece desabilitada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-[24px] bg-mist p-4">
            <div
              aria-label="QR Code visual da Evolution"
              className="grid aspect-square w-full grid-cols-[repeat(21,minmax(0,1fr))] gap-0.5 rounded-[18px] bg-snow p-3 ring-1 ring-fog"
            >
              {matrizQrVisual.flatMap((linha, indiceLinha) =>
                [...linha].map((valor, indiceColuna) => (
                  <span
                    key={`${indiceLinha}-${indiceColuna}`}
                    className={valor === "1" ? "rounded-[1px] bg-obsidian" : "rounded-[1px] bg-snow"}
                  />
                )),
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-mist p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-obsidian text-snow">
              <Smartphone className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-ink">Leitura preparada</h3>
            <p className="mt-2 text-sm text-steel">
              No fluxo real, este modal buscará o QR Code da instância configurada na Evolution API e atualizará o
              status da conexão.
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-steel">Provedor</dt>
                <dd className="font-medium text-ink">Evolution API</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-steel">Status</dt>
                <dd className="font-medium text-ink">Visual</dd>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter className="rounded-b-[28px]">
          <Button type="button" variant="outline" className="rounded-full">
            Atualizar QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
