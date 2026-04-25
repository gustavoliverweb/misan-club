"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth-actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-50"
    >
      <LogOut size={14} />
      {pending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
