import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { FormularioSimulador } from "../forms/formulario_simulador";

export function SimuladorView() {
  return (
    <section>
      <CabecalhoPagina
        titulo="Simulador"
        descricao="Teste o Intent Solver usando as intenções ativas do banco, sem criar chamado automaticamente."
      />
      <FormularioSimulador />
    </section>
  );
}
