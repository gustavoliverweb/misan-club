import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/infra/db";
import { getDownline, getFullDownline } from "@/infra/db/queries/downline";
import { BentoCard } from "@/components/ui/bento-card";
import { NetworkTree } from "@/components/network/network-tree";
import { buildTree } from "@/lib/network-tree";

const LEVEL_PCTS: Record<number, string> = {
  1: "10%",
  2: "5%",
  3: "3%",
  4: "2%",
  5: "1%",
};

const LEVEL_BADGE: Record<number, string> = {
  1: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  2: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  3: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  4: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  5: "border-slate-500/25 bg-slate-500/8 text-slate-500 dark:text-slate-400",
};

const LEVEL_DOT: Record<number, string> = {
  1: "bg-cyan-500 dark:bg-cyan-400",
  2: "bg-blue-500 dark:bg-blue-400",
  3: "bg-indigo-500 dark:bg-indigo-400",
  4: "bg-violet-500 dark:bg-violet-400",
  5: "bg-slate-400 dark:bg-slate-500",
};

export default async function MyNetworkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [downline, fullDownline] = await Promise.all([
    getDownline(db, user.id),
    getFullDownline(db, user.id),
  ]);

  const byLevel = downline.reduce<Record<number, number>>((acc, m) => {
    acc[m.level] = (acc[m.level] ?? 0) + 1;
    return acc;
  }, {});

  const totalNetwork = fullDownline.length;
  const treeNodes = buildTree(fullDownline, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-3">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Mi Red</h1>
        <p className="mt-1 text-sm text-muted">
          {totalNetwork === 0
            ? "Aún no tienes socios en tu red"
            : `${totalNetwork} ${totalNetwork === 1 ? "socio" : "socios"} en tu estructura descendente`}
        </p>
      </div>

      {/* Level summary — 5 stat cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((lvl) => {
          const count = byLevel[lvl] ?? 0;
          const isActive = count > 0;
          return (
            <BentoCard key={lvl} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  N{lvl}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    isActive ? "bg-accent" : "bg-faint"
                  }`}
                />
              </div>
              <p
                className={`mt-3 text-3xl font-bold tabular-nums tracking-tight ${
                  isActive ? "text-fg" : "text-faint"
                }`}
              >
                {count}
              </p>
              <p className="mt-2 text-xs text-faint">{LEVEL_PCTS[lvl]} comisión</p>
            </BentoCard>
          );
        })}
      </div>

      {/* Network tree */}
      <BentoCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Socios
          </p>
          <span className="tabular-nums text-sm text-faint">{totalNetwork}</span>
        </div>

        {fullDownline.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users size={36} className="text-faint" />
            <div>
              <p className="text-sm font-medium text-muted">
                Aún no tienes socios en tu red
              </p>
              <p className="mt-1 text-xs text-faint">
                Comparte tu enlace de referido para empezar a construir tu red.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
              <div className="w-5 shrink-0" />
              <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-faint">
                Nombre
              </span>
              <span className="w-16 shrink-0 text-right text-xs font-semibold uppercase tracking-widest text-faint">
                Nivel
              </span>
              <span className="hidden w-28 shrink-0 text-right text-xs font-semibold uppercase tracking-widest text-faint sm:block">
                Ingreso
              </span>
            </div>
            <NetworkTree nodes={treeNodes} />
          </>
        )}
      </BentoCard>
    </div>
  );
}
