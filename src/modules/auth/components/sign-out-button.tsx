"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "../actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      className="w-full"
      loading={isPending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {!isPending && <LogOut aria-hidden />}
      Terminar sessão
    </Button>
  );
}
