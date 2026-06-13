import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { FormularioSimulador } from "../forms/formulario_simulador";

export function SimuladorView() {
  return (
    <section>
      <CabecalhoPagina
        titulo="Simulador"
        descricao="Simule a captura de e-mail ou WhatsApp, classifique com o Intent Solver e crie chamados automaticamente sem integrações externas reais."
      />
      <FormularioSimulador />
    </section>
  );
}
