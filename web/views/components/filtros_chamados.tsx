import Link from "next/link";

import { ORIGENS_CHAMADO, PRIORIDADES, STATUS_CHAMADO } from "../../types/dominio";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Opcao = {
  id: string;
  nome: string;
};

type FiltrosChamadosProps = {
  setores: Opcao[];
  responsaveis: Opcao[];
  valores: Record<string, string | undefined>;
};

export function FiltrosChamados({ setores, responsaveis, valores }: FiltrosChamadosProps) {
  return (
    <form className="mb-4 grid gap-3 rounded-[28px] bg-snow p-4 ring-1 ring-fog md:grid-cols-6">
      <div className="md:col-span-2">
        <Label htmlFor="busca">Busca</Label>
        <Input id="busca" name="busca" defaultValue={valores.busca} placeholder="Título, assunto ou descrição" className="mt-2" />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={valores.status ?? ""} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Todos</option>
          {STATUS_CHAMADO.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="prioridade">Prioridade</Label>
        <select id="prioridade" name="prioridade" defaultValue={valores.prioridade ?? ""} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Todas</option>
          {PRIORIDADES.map((prioridade) => (
            <option key={prioridade} value={prioridade}>
              {prioridade}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="setorId">Setor</Label>
        <select id="setorId" name="setorId" defaultValue={valores.setorId ?? ""} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Todos</option>
          {setores.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="responsavelId">Responsável</Label>
        <select id="responsavelId" name="responsavelId" defaultValue={valores.responsavelId ?? ""} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Todos</option>
          {responsaveis.map((responsavel) => (
            <option key={responsavel.id} value={responsavel.id}>
              {responsavel.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="origem">Origem</Label>
        <select id="origem" name="origem" defaultValue={valores.origem ?? ""} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="">Todas</option>
          {ORIGENS_CHAMADO.map((origem) => (
            <option key={origem} value={origem}>
              {origem}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="ordenarPor">Ordenar</Label>
        <select id="ordenarPor" name="ordenarPor" defaultValue={valores.ordenarPor ?? "recentes"} className="mt-2 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="prioridade">Prioridade</option>
          <option value="status">Status</option>
          <option value="titulo">Título</option>
        </select>
      </div>
      <div className="flex items-end gap-2 md:col-span-6">
        <Button type="submit" className="rounded-full bg-obsidian text-snow shadow-subtle">
          Filtrar
        </Button>
        <Button asChild type="button" variant="outline" className="rounded-full">
          <Link href="/chamados">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
