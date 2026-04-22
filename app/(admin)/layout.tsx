import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ClipboardList, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar — desktop only ──────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-6">
          <ShieldCheck size={18} className="text-blue-600" />
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Misan<span className="text-blue-600">Club</span>
          </span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            Admin
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Link
            href="/admin/kyc"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ClipboardList size={18} strokeWidth={2} />
            Revisión KYC
          </Link>
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LayoutDashboard size={14} />
            Volver al dashboard
          </Link>
          <p className="truncate text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 lg:hidden">
          <ShieldCheck size={16} className="text-blue-600" />
          <span className="text-base font-bold tracking-tight text-gray-900">
            Misan<span className="text-blue-600">Club</span>
          </span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            Admin
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
