"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function ThemeToggle({ className }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer",
        "text-xs font-medium text-muted transition-colors",
        "hover:bg-subtle hover:text-fg",
        className,
      )}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </span>
      <span className="text-sm">{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}
