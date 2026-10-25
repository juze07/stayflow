import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <p className="font-mono text-sm font-medium text-subtle-foreground">404</p>
      <h1 className="font-display text-4xl">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">A página que procura não existe ou foi movida.</p>
      <Button asChild>
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
