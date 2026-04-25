"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitBranch, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Inicio",   icon: LayoutDashboard },
  { href: "/my-network", label: "Mi Red",   icon: GitBranch },
  { href: "/wallet",     label: "Billetera", icon: Wallet },
  { href: "/settings",   label: "Config",   icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-16 items-center justify-around border-t border-border bg-card">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors",
              active ? "text-accent" : "text-muted hover:text-fg",
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
