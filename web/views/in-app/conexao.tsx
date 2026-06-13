import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { EstadoVazio } from "../components/estado_vazio";

export function ConexaoView() {
  return (
    <section>
      <CabecalhoPagina
        titulo="Conexão"
        descricao="Configuração futura da Evolution API em VPS separada."
      />
      <EstadoVazio
        titulo="Evolution API desabilitada"
        descricao="Nenhuma credencial externa é necessária para avaliar o núcleo de chamados, Intent Solver e distribuição automática."
      />
    </section>
  );
}
