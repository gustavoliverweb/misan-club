"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Wallet,
  Settings,
  ShieldCheck,
  Share2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Inicio",        icon: LayoutDashboard },
  { href: "/my-network", label: "Mi Red",        icon: GitBranch },
  { href: "/wallet",     label: "Billetera",     icon: Wallet },
  { href: "/settings",   label: "Configuración", icon: Settings },
];

interface Props {
  role?: string;
  userId?: string;
}

export function SidebarNav({ role, userId }: Props) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  function copyReferralLink() {
    const base = window.location.origin;
    navigator.clipboard.writeText(`${base}/register?ref=${userId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-subtle font-medium text-fg"
                : "font-normal text-muted hover:bg-hover hover:text-fg",
            )}
          >
            <Icon
              size={15}
              strokeWidth={active ? 2.25 : 1.75}
              className={active ? "text-accent" : ""}
            />
            {label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}

      <div className="mx-3 my-2 border-t border-border" />

      <button
        onClick={copyReferralLink}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal text-muted transition-colors hover:bg-hover hover:text-fg w-full text-left"
      >
        {copied ? (
          <Check size={15} strokeWidth={1.75} className="text-accent" />
        ) : (
          <Share2 size={15} strokeWidth={1.75} />
        )}
        {copied ? "¡Enlace copiado!" : "Compartir mi enlace"}
      </button>

      {role === "admin" && (
        <>
          <div className="mx-3 my-2 border-t border-border" />
          <Link
            href="/admin/kyc"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal text-muted transition-colors hover:bg-hover hover:text-fg"
          >
            <ShieldCheck size={15} strokeWidth={1.75} className="text-accent" />
            Panel Admin
          </Link>
        </>
      )}
    </nav>
  );
}
