import { redirect } from "next/navigation";

import { obterSessaoAtual } from "../../../web/lib/auth";
import { LoginView } from "../../../web/views/public/login";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const sessao = await obterSessaoAtual();

  if (sessao) {
    redirect("/dashboard");
  }

  return <LoginView />;
}
