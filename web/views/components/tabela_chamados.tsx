import Link from "next/link";

import type { ChamadoComRelacoes } from "../../types/chamado";
import { formatarDataHora } from "../../utils/utils";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BadgeOrigem } from "./badge_origem";
import { BadgePrioridade } from "./badge_prioridade";
import { BadgeStatus } from "./badge_status";
import { EstadoVazio } from "./estado_vazio";

type TabelaChamadosProps = {
  chamados: ChamadoComRelacoes[];
};

export function TabelaChamados({ chamados }: TabelaChamadosProps) {
  if (chamados.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum chamado encontrado"
        descricao="Ajuste os filtros ou crie um novo chamado para começar o acompanhamento."
        acao={
          <Button asChild className="rounded-full bg-obsidian text-snow shadow-subtle">
            <Link href="/chamados/novo">Novo chamado</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] bg-snow ring-1 ring-fog">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chamado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamados.map((chamado) => (
              <TableRow key={chamado.id}>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="font-medium text-ink">{chamado.titulo}</p>
                    <p className="truncate text-xs text-steel">{chamado.assunto ?? chamado.descricao}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <BadgeStatus status={chamado.status} />
                </TableCell>
                <TableCell>
                  <BadgePrioridade prioridade={chamado.prioridade} />
                </TableCell>
                <TableCell>{chamado.setor.nome}</TableCell>
                <TableCell>{chamado.responsavel?.nome ?? "Sem atendente disponível"}</TableCell>
                <TableCell>
                  <BadgeOrigem origem={chamado.origem} />
                </TableCell>
                <TableCell>{formatarDataHora(chamado.dataAbertura)}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href={`/chamados/${chamado.id}`}>Abrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {chamados.map((chamado) => (
          <Link key={chamado.id} href={`/chamados/${chamado.id}`} className="rounded-[24px] bg-mist p-4">
            <div className="flex flex-wrap gap-2">
              <BadgeStatus status={chamado.status} />
              <BadgePrioridade prioridade={chamado.prioridade} />
            </div>
            <h2 className="mt-3 font-semibold text-ink">{chamado.titulo}</h2>
            <p className="mt-1 text-sm text-steel">{chamado.setor.nome}</p>
            <p className="mt-2 text-xs text-steel">{formatarDataHora(chamado.dataAbertura)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
