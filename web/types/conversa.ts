import type { OrigemChamadoValor } from "./dominio";

export type MensagemConversaResumo = {
  id: string;
  remetente: string | null;
  mensagem: string;
  origem: OrigemChamadoValor;
  assuntoIdentificado: string | null;
  confianca: number | null;
  criadoEm: string;
};

export type ConversaAtendimentoResumo = {
  id: string;
  telefoneCliente: string;
  estado: string;
  primeiraMensagemEm: string;
  ultimaInteracaoEm: string;
  ultimaRespostaHumanaEm: string | null;
  finalizadoEm: string | null;
  expiraEm: string;
  protocoloEnviadoEm: string | null;
  chamado: {
    id: string;
    protocolo: string | null;
    titulo: string;
    assunto: string | null;
    setor: { id: string; nome: string };
    responsavel: { id: string; nome: string; email: string } | null;
  } | null;
  mensagens: MensagemConversaResumo[];
};
