import { redirect } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-lg space-y-3">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Configuración</h1>
        <p className="mt-1 text-sm text-muted">Información de tu cuenta</p>
      </div>

      {/* Profile card */}
      <BentoCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Perfil
        </p>

        {/* Avatar + identity */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-base font-bold text-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{user.fullName}</p>
            <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>

        {/* Metadata rows */}
        <dl className="mt-6 divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm text-muted">Rol</dt>
            <dd>
              <Badge variant="neutral" className="capitalize">{user.role}</Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-sm text-muted">Estado KYC</dt>
            <dd>
              <Badge
                variant={
                  user.kycStatus === "verified"
                    ? "success"
                    : user.kycStatus === "rejected"
                    ? "error"
                    : "warning"
                }
              >
                {user.kycStatus.toUpperCase()}
              </Badge>
            </dd>
          </div>
        </dl>
      </BentoCard>

      {/* Placeholder */}
      <BentoCard className="flex items-center gap-3">
        <SettingsIcon size={18} className="shrink-0 text-faint" />
        <p className="text-sm text-muted">
          Más opciones de configuración disponibles próximamente.
        </p>
      </BentoCard>
    </div>
  );
}
