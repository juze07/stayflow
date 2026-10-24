"use client";

import { Check, ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/modules/auth/actions";
import { switchBusinessAction } from "@/modules/business/actions";
import { ROLE_LABELS, type Role } from "@/modules/business/roles";

type UserMenuProps = {
  fullName: string;
  email: string;
  role: Role;
  activeBusinessId: string;
  activeBusinessName: string;
  businesses: { id: string; name: string }[];
};

export function UserMenu({ fullName, email, role, activeBusinessId, activeBusinessName, businesses }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted disabled:opacity-60"
        disabled={isPending}
      >
        <Avatar name={fullName} email={email} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{fullName || email}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {activeBusinessName} · {ROLE_LABELS[role]}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        {businesses.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            {businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onSelect={() => {
                  if (business.id !== activeBusinessId) {
                    startTransition(async () => {
                      await switchBusinessAction(business.id);
                    });
                  }
                }}
              >
                <span className="flex-1 truncate">{business.name}</span>
                {business.id === activeBusinessId && <Check aria-label="Empresa ativa" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/definicoes">
            <UserRound aria-hidden />O meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            startTransition(async () => {
              await signOutAction();
            });
          }}
        >
          <LogOut aria-hidden />
          Terminar sessão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
