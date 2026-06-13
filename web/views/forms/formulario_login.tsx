"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function FormularioLogin() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setCarregando(true);
    setErro(null);

    const formData = new FormData(evento.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        senha: formData.get("senha"),
      }),
    });

    const data = (await response.json()) as { sucesso: boolean; mensagem?: string };

    setCarregando(false);

    if (!data.sucesso) {
      setErro(data.mensagem ?? "Não foi possível entrar.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="mt-2 h-11 rounded-[14px] bg-snow" />
      </div>
      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required className="mt-2 h-11 rounded-[14px] bg-snow" />
      </div>
      {erro ? <p className="rounded-2xl bg-fog px-3 py-2 text-sm text-ink">{erro}</p> : null}
      <Button type="submit" disabled={carregando} className="h-11 w-full rounded-full bg-obsidian text-snow shadow-subtle">
        {carregando ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
