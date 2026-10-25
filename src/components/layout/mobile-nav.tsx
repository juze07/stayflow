"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

/** Botão de menu e gaveta lateral, visível apenas em ecrãs pequenos. */
export function MobileNav({ businessSlot }: { businessSlot: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="-ml-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent title="Menu">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="p-3">{businessSlot}</div>
      </SheetContent>
    </Sheet>
  );
}
