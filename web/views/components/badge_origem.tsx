import { Badge } from "../ui/badge";
import { LABEL_ORIGEM, type OrigemChamadoValor } from "../../types/dominio";

type BadgeOrigemProps = {
  origem: OrigemChamadoValor;
};

const classes: Record<OrigemChamadoValor, string> = {
  MANUAL: "bg-fog text-graphite",
  SIMULADOR: "bg-graphite text-snow",
  WHATSAPP: "bg-obsidian text-snow",
  EMAIL: "bg-snow text-obsidian ring-1 ring-graphite",
};

export function BadgeOrigem({ origem }: BadgeOrigemProps) {
  return <Badge className={classes[origem]}>{LABEL_ORIGEM[origem]}</Badge>;
}
