import { ResponsaveisView } from "../responsaveis";

type AdminAtendentesViewProps = Parameters<typeof ResponsaveisView>[0];

export function AdminAtendentesView(props: AdminAtendentesViewProps) {
  return <ResponsaveisView {...props} />;
}
