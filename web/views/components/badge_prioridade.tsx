import { Badge } from "../ui/badge";
import { LABEL_PRIORIDADE, type PrioridadeValor } from "../../types/dominio";

type BadgePrioridadeProps = {
  prioridade: PrioridadeValor;
};

const classes: Record<PrioridadeValor, string> = {
  BAIXA: "bg-fog text-graphite",
  MEDIA: "bg-graphite text-snow",
  ALTA: "bg-obsidian text-snow",
};

export function BadgePrioridade({ prioridade }: BadgePrioridadeProps) {
  return <Badge className={classes[prioridade]}>{LABEL_PRIORIDADE[prioridade]}</Badge>;
}
