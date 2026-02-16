"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileSidebar } from "@/contexts/mobile-sidebar-context";

export function MobileSidebarTrigger() {
  const { open, setOpen } = useMobileSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-30 md:hidden"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-controls="mobile-sidebar"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
