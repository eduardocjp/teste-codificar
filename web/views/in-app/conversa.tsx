import { CabecalhoPagina } from "../components/cabecalho_pagina";
import { EstadoVazio } from "../components/estado_vazio";

export function ConversaView() {
  return (
    <section>
      <CabecalhoPagina
        titulo="Conversas"
        descricao="Histórico de mensagens do simulador e da futura integração WhatsApp."
      />
      <EstadoVazio
        titulo="Mensageria opcional"
        descricao="A integração Evolution API permanece desabilitada no MVP. O sistema funciona integralmente pelo cadastro manual."
      />
    </section>
  );
}
