"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Wallet,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Inicio",        icon: LayoutDashboard },
  { href: "/my-network",  label: "Mi Red",        icon: GitBranch },
  { href: "/wallet",      label: "Billetera",     icon: Wallet },
  { href: "/settings",    label: "Configuración", icon: Settings },
];

type Props = { role?: string };

export function SidebarNav({ role }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
      {role === "admin" && (
        <Link
          href="/admin/kyc"
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          <ShieldCheck size={18} strokeWidth={2} />
          Panel Admin
        </Link>
      )}
    </nav>
  );
}
