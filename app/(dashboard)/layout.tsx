import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold uppercase text-accent">
      {letters}
    </span>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex w-[var(--sidebar-w)] shrink-0 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
          <span className="text-2xl font-bold tracking-tight text-fg">
            Misan<span className="text-accent">Club</span>
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav role={user.role} />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-0.5">
          <ThemeToggle />

          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Initials name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-fg leading-tight">
                {user.fullName}
              </p>
              <p className="truncate text-[12px] text-muted leading-tight mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <span className="text-sm font-bold tracking-tight text-fg">
            Misan<span className="text-accent">Club</span>
          </span>
          <div className="flex items-center gap-2">
            <Initials name={user.fullName} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8">
          {children}
        </main>

        <div className="sticky bottom-0 lg:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
