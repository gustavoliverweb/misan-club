import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  AlertCircle,
  PartyPopper,
  ChevronRight,
  Users,
  Store,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/infra/db";
import { transactions, networkHierarchy } from "@/infra/db/schema";
import { WalletService } from "@/core/services/wallet.service";
import { Badge } from "@/components/ui/badge";
import { KycUploadDialog } from "@/components/kyc/kyc-upload-dialog";
import { BentoCard, BentoCardLink } from "@/components/ui/bento-card";
import { RenewMembershipButton } from "@/components/dashboard/renew-membership-button";
import { CopyStoreLinkButton } from "@/components/dashboard/copy-store-link-button";

const walletService = new WalletService();

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "short" });

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ renewal?: string }>;
}) {
  await connection();
  const { renewal } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  /* ── Data fetching ──────────────────────────────── */
  const [txRows, [networkRow]] = await Promise.all([
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(20),

    db
      .select({ total: count() })
      .from(networkHierarchy)
      .where(eq(networkHierarchy.sponsorId, user.id)),
  ]);

  const domainTxs = txRows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
    referenceId: undefined,
    checksum: "",
    userId: user.id,
  }));

  const balance = walletService.computeBalance(domainTxs);
  const networkCount = networkRow?.total ?? 0;
  const recentActivity = txRows.slice(0, 5);

  /* ── Sparkline (last 8 credits) ─────────────────── */
  const credits = txRows
    .filter((t) => t.type === "credit")
    .slice(0, 8)
    .reverse();
  const maxCredit = credits.length
    ? Math.max(...credits.map((t) => parseFloat(t.amount)))
    : 1;

  /* ── Derived state ──────────────────────────────── */
  const membershipActive = user.membership?.status === "active";
  const kycVerified = user.kycStatus === "verified";

  const expiresAt = user.membership?.expiresAt
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
        new Date(user.membership.expiresAt),
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-3">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Panel de control
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-fg">
          Hola, {user.fullName.split(" ")[0]}
        </h1>
      </div>

      {/* Banners */}
      {renewal === "success" && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <PartyPopper size={15} className="shrink-0 text-green-500" />
          <p className="text-sm text-green-600 dark:text-green-400">
            ¡Membresía activada! Tu acceso está activo durante 30 días.
          </p>
        </div>
      )}
      {renewal === "canceled" && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertCircle size={15} className="shrink-0 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Pago cancelado. Tu membresía no ha sido modificada.
          </p>
        </div>
      )}

      {/* ── Bento Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">

        {/* 1. Billetera — hero, col-span-2 */}
        <Link
          href="/wallet"
          className="group relative overflow-hidden rounded-2xl bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 lg:col-span-2 shadow-[rgba(0,0,0,0.07)_0px_0px_0px_1px] dark:shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px,_rgba(0,153,255,0.05)_0px_0px_48px_0px] dark:hover:shadow-[rgba(0,153,255,0.25)_0px_0px_0px_1px,_rgba(0,153,255,0.08)_0px_0px_48px_0px]"
        >
          {/* Radial glow aura */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)]"
          />

          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              Billetera
            </p>
            <span className="flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Ver detalles <ChevronRight size={12} />
            </span>
          </div>

          <div className="mt-5">
            <p
              className="text-5xl font-bold tabular-nums text-fg"
              style={{ letterSpacing: "-0.04em" }}
            >
              {fmt.format(balance)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {txRows.length} transacciones registradas
            </p>
          </div>

          {/* Sparkline */}
          {credits.length > 0 ? (
            <div className="mt-6 flex h-12 items-end gap-1">
              {credits.map((t, i) => {
                const h = Math.max(
                  6,
                  Math.round((parseFloat(t.amount) / maxCredit) * 48),
                );
                return (
                  <div
                    key={t.id}
                    title={fmt.format(parseFloat(t.amount))}
                    className="flex-1 rounded-sm bg-accent/20 transition-colors group-hover:bg-accent/35"
                    style={{ height: h, animationDelay: `${i * 40}ms` }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex h-12 items-end gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-border"
                  style={{ height: 6 + i * 2 }}
                />
              ))}
            </div>
          )}
        </Link>

        {/* 2. Membresía — col-span-1 */}
        <BentoCard>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Membresía
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                membershipActive
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {membershipActive ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
            </div>
            <div>
              <Badge variant={membershipActive ? "success" : "error"}>
                {membershipActive
                  ? "ACTIVA"
                  : user.membership
                  ? "EXPIRADA"
                  : "SIN MEMBRESÍA"}
              </Badge>
              {expiresAt && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                  <Clock size={10} />
                  Vence {expiresAt}
                </p>
              )}
            </div>
          </div>

          {!membershipActive && user.membership && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-red-400">
                Renueva para seguir recibiendo comisiones.
              </p>
              <RenewMembershipButton />
            </div>
          )}

          {!user.membership && (
            <div className="mt-4">
              <RenewMembershipButton label="Activar membresía — 30 €" />
            </div>
          )}

          {membershipActive && user.membership?.autoRenew && (
            <p className="mt-4 text-[11px] text-muted">
              Renovación automática activada
            </p>
          )}
        </BentoCard>

        {/* 3. Mi Red */}
        <BentoCardLink href="/my-network">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Mi Red
          </p>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p
                className="text-4xl font-bold tabular-nums text-fg"
                style={{ letterSpacing: "-0.04em" }}
              >
                {networkCount}
              </p>
              <p className="mt-1 text-xs text-muted">
                {networkCount === 1 ? "socio directo" : "socios directos"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Users size={18} className="text-accent transition-colors group-hover:text-accent" />
            </div>
          </div>

          <div className="mt-5 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === 0
                    ? "bg-accent"
                    : i === 1
                    ? "bg-accent/50"
                    : i === 2
                    ? "bg-accent/25"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] uppercase tracking-widest text-faint">
            5 niveles activos
          </p>
        </BentoCardLink>

        {/* 4. KYC */}
        <BentoCard>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Verificación KYC
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                kycVerified
                  ? "bg-green-500/10"
                  : user.kycStatus === "rejected"
                  ? "bg-red-500/10"
                  : "bg-amber-500/10"
              }`}
            >
              {kycVerified ? (
                <ShieldCheck size={20} className="text-green-500" />
              ) : user.kycStatus === "rejected" ? (
                <ShieldX size={20} className="text-red-500" />
              ) : (
                <ShieldAlert size={20} className="text-amber-500" />
              )}
            </div>
            <div>
              <Badge
                variant={
                  kycVerified
                    ? "success"
                    : user.kycStatus === "rejected"
                    ? "error"
                    : "warning"
                }
              >
                {kycVerified
                  ? "VERIFICADO"
                  : user.kycStatus === "rejected"
                  ? "RECHAZADO"
                  : "PENDIENTE"}
              </Badge>
              <p className="mt-1 text-[11px] text-muted leading-snug">
                {kycVerified
                  ? "Retiros disponibles"
                  : "Requerido para retirar"}
              </p>
            </div>
          </div>

          {!kycVerified && (
            <div className="mt-4">
              <KycUploadDialog kycStatus={user.kycStatus} />
            </div>
          )}
        </BentoCard>

        {/* 5. Mi Tienda */}
        <BentoCard>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Mi Tienda
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Store size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-fg">Tu tienda personal</p>
              <p className="text-[11px] text-muted">Comparte y vende sin intermediarios</p>
            </div>
          </div>

          <CopyStoreLinkButton userId={user.id} />
        </BentoCard>

        {/* 6. Configuración */}
        <BentoCardLink href="/settings">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Configuración
          </p>

          <div className="mt-4 flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-fg">Perfil y seguridad</p>
              <p className="text-xs text-muted">Contraseña, preferencias</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-subtle">
              <Settings
                size={18}
                className="text-muted transition-all duration-300 group-hover:rotate-45 group-hover:text-fg"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
            Ir a configuración <ChevronRight size={12} />
          </div>
        </BentoCardLink>

        {/* 6. Actividad reciente — full width */}
        <BentoCard className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              Actividad reciente
            </p>
            {txRows.length > 5 && (
              <Link
                href="/wallet"
                className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition-opacity"
              >
                Ver todo <ChevronRight size={12} />
              </Link>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-subtle">
                <WalletIcon size={20} className="text-faint" />
              </div>
              <p className="mt-2 text-sm font-medium text-fg">Sin movimientos</p>
              <p className="text-xs text-muted">
                Las comisiones aparecerán aquí una vez proceses una venta.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              {/* Header row */}
              <div className="mb-2 hidden grid-cols-[auto_1fr_auto_auto] gap-4 px-1 md:grid">
                <span className="w-7" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Concepto
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Fecha
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-faint">
                  Importe
                </span>
              </div>

              <ul className="divide-y divide-border">
                {recentActivity.map((tx) => (
                  <li
                    key={tx.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 first:pt-1 last:pb-1 md:grid-cols-[auto_1fr_auto_auto]"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        tx.type === "credit"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <ArrowDownLeft size={13} />
                      ) : (
                        <ArrowUpRight size={13} />
                      )}
                    </span>

                    <span className="min-w-0 truncate text-sm text-fg">
                      {tx.description}
                    </span>

                    <span className="hidden shrink-0 text-xs text-muted md:block">
                      {fmtDate.format(new Date(tx.createdAt))}
                    </span>

                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        tx.type === "credit" ? "text-green-500" : "text-red-500"
                      }`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {tx.type === "credit" ? "+" : "−"}
                      {fmt.format(parseFloat(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
