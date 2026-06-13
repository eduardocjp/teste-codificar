import type { PrioridadeValor } from "./dominio";
import type { SetorResumo } from "./setor";

export type IntencaoConfigurada = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  assuntoSugerido: string;
  palavrasChave: string[];
  exemplos: string[];
  prioridadeSugerida: PrioridadeValor;
  confiancaMinima: number;
  ativo: boolean;
  setor: SetorResumo;
};

export type ResultadoResolucaoIntencao = {
  identificada: boolean;
  intencaoId: string | null;
  nomeIntencao: string | null;
  assuntoSugerido: string;
  tituloSugerido: string;
  setorId: string;
  setorNome: string;
  prioridadeSugerida: PrioridadeValor;
  confianca: number;
  termosEncontrados: string[];
};
