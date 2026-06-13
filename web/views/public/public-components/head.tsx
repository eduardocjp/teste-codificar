import Link from "next/link";

import { Button } from "../../ui/button";

export function PublicHead() {
  return (
    <header className="sticky top-0 z-30 bg-mist/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between rounded-full bg-snow px-3 py-2 ring-1 ring-fog">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-ink">
          <span className="flex size-9 items-center justify-center rounded-full bg-obsidian text-snow">SC</span>
          Sistema de Chamados
        </Link>
        <Button asChild className="rounded-full bg-obsidian px-4 text-snow shadow-subtle">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </header>
  );
}
