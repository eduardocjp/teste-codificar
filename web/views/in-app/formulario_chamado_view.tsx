import type { ChamadoComRelacoes } from "../../types/chamado";
import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { FormularioChamado } from "../forms/formulario_chamado";

type SetorOpcao = {
  id: string;
  nome: string;
};

type ResponsavelOpcao = {
  id: string;
  nome: string;
  setorId: string | null;
};

type FormularioChamadoViewProps = {
  setores: SetorOpcao[];
  responsaveis: ResponsavelOpcao[];
  chamado?: ChamadoComRelacoes;
};

export function FormularioChamadoView({ setores, responsaveis, chamado }: FormularioChamadoViewProps) {
  return (
    <section>
      <CabecalhoPagina
        titulo={chamado ? "Editar chamado" : "Novo chamado"}
        descricao="Preencha manualmente ou use o Intent Solver para sugerir setor, prioridade e assunto."
      />
      <FormularioChamado setores={setores} responsaveis={responsaveis} chamado={chamado} />
    </section>
  );
}
