import type { OrigemChamadoValor, PrioridadeValor, StatusChamadoValor } from "./dominio";

export type ChamadoComRelacoes = {
  id: string;
  titulo: string;
  descricao: string;
  assunto: string | null;
  prioridade: PrioridadeValor;
  status: StatusChamadoValor;
  origem: OrigemChamadoValor;
  setorId: string;
  responsavelId: string | null;
  intencaoId: string | null;
  confiancaIntencao: number | null;
  dataAbertura: Date;
  dataAtualizacao: Date;
  dataResolucao: Date | null;
  dataFechamento: Date | null;
  setor: {
    id: string;
    nome: string;
  };
  responsavel: {
    id: string;
    nome: string;
    email: string;
  } | null;
  intencao: {
    id: string;
    nome: string;
  } | null;
};

export type FiltrosChamado = {
  status?: StatusChamadoValor;
  prioridade?: PrioridadeValor;
  setorId?: string;
  responsavelId?: string;
  origem?: OrigemChamadoValor;
  busca?: string;
  pagina: number;
  limite: number;
  ordenarPor: "recentes" | "antigos" | "prioridade" | "status" | "titulo";
};
