export type MensagemEmailNormalizada = {
  canal: "EMAIL";
  identificadorExterno: string;
  identificadorRoteamento: string;
  remetente: string;
  nomeRemetente: string | null;
  destinatario: string;
  assunto: string | null;
  conteudo: string;
  cabecalhos: Record<string, string>;
  possuiAnexos: boolean;
  recebidoEm: Date;
};
