"use client";

import { LogOut } from "@/components/ui/icons";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "../actions";

export function SignOutButton({ className = "w-full" }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      className={className}
      loading={isPending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {!isPending && <LogOut aria-hidden />}
      Terminar sessão
    </Button>
  );
}
