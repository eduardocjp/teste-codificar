export const PERFIS_USUARIO = ["ADMINISTRADOR", "ATENDENTE"] as const;
export const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const;
export const STATUS_CHAMADO = ["ABERTO", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"] as const;
export const ORIGENS_CHAMADO = ["MANUAL", "SIMULADOR", "WHATSAPP", "EMAIL"] as const;
export const STATUS_CHAMADOS_ATIVOS = ["ABERTO", "EM_ANDAMENTO"] as const;

export type PerfilUsuarioValor = (typeof PERFIS_USUARIO)[number];
export type PrioridadeValor = (typeof PRIORIDADES)[number];
export type StatusChamadoValor = (typeof STATUS_CHAMADO)[number];
export type OrigemChamadoValor = (typeof ORIGENS_CHAMADO)[number];

export const LABEL_PRIORIDADE: Record<PrioridadeValor, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const LABEL_STATUS: Record<StatusChamadoValor, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
};

export const LABEL_ORIGEM: Record<OrigemChamadoValor, string> = {
  MANUAL: "Manual",
  SIMULADOR: "Simulador",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
};
