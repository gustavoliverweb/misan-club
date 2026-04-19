import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar — desktop only ──────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Misan<span className="text-blue-600">Club</span>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t border-gray-200 p-4 space-y-2">
          <p className="truncate text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
          <span className="text-base font-bold tracking-tight text-gray-900">
            Misan<span className="text-blue-600">Club</span>
          </span>
          <span className="ml-auto text-sm text-gray-500">{user.fullName}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-8 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="sticky bottom-0 lg:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
