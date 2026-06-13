import { Badge } from "../ui/badge";
import { LABEL_STATUS, type StatusChamadoValor } from "../../types/dominio";

type BadgeStatusProps = {
  status: StatusChamadoValor;
};

const classes: Record<StatusChamadoValor, string> = {
  ABERTO: "bg-snow text-ink ring-1 ring-fog",
  EM_ANDAMENTO: "bg-graphite text-snow",
  RESOLVIDO: "bg-fog text-graphite",
  FECHADO: "bg-obsidian text-snow",
};

export function BadgeStatus({ status }: BadgeStatusProps) {
  return <Badge className={classes[status]}>{LABEL_STATUS[status]}</Badge>;
}
