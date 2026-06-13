import { buscarSetorTriagem, listarSetoresAtivos } from "./repositorio_setor";

/**
 * Lista setores disponíveis para formulários e filtros.
 */
export async function obterSetoresParaSelecao() {
  return listarSetoresAtivos();
}

/**
 * Obtém o setor de triagem obrigatório para fallback do Intent Solver.
 */
export async function obterSetorTriagemObrigatorio() {
  const setor = await buscarSetorTriagem();

  if (!setor) {
    throw new Error("Setor de triagem não configurado.");
  }

  return setor;
}
