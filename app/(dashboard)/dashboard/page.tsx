import { redirect } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membershipActive = user.membership?.status === "active";
  const kycVerified = user.kycStatus === "verified";

  const expiresAt = user.membership?.expiresAt
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
        new Date(user.membership.expiresAt)
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Resumen de tu cuenta MisanClub</p>
      </div>

      {/* ── Membership widget ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Membresía</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {membershipActive ? (
                <CheckCircle2 size={32} className="text-green-500" />
              ) : (
                <XCircle size={32} className="text-red-500" />
              )}
              <div>
                <Badge variant={membershipActive ? "success" : "error"}>
                  {membershipActive ? "ACTIVA" : "EXPIRADA"}
                </Badge>
                {expiresAt && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    Vence el {expiresAt}
                  </p>
                )}
              </div>
            </div>
            {user.membership?.autoRenew && (
              <span className="text-xs text-gray-400">Renovación automática activada</span>
            )}
          </div>

          {!membershipActive && (
            <div className="mt-4 rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-700">
                Tu membresía ha expirado. Renuévala para seguir recibiendo comisiones.
              </p>
              <Button variant="destructive" size="sm" className="mt-2">
                Renovar membresía
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── KYC widget ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Verificación de Identidad (KYC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {kycVerified ? (
                <ShieldCheck size={32} className="text-green-500" />
              ) : (
                <ShieldAlert size={32} className="text-amber-500" />
              )}
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
                  {user.kycStatus === "verified"
                    ? "VERIFICADO"
                    : user.kycStatus === "rejected"
                    ? "RECHAZADO"
                    : "PENDIENTE"}
                </Badge>
                <p className="mt-1 text-xs text-gray-500">
                  {kycVerified
                    ? "Puedes realizar retiros libremente."
                    : "Necesitas verificar tu identidad para poder retirar fondos."}
                </p>
              </div>
            </div>

            {!kycVerified && (
              <Button className="shrink-0 bg-amber-500 hover:bg-amber-600">
                <AlertCircle size={15} />
                Subir Documentación
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick links ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <a href="/wallet" className="group flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                Billetera →
              </span>
              <span className="text-xs text-gray-500">Ver saldo y movimientos</span>
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <a href="/my-network" className="group flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                Mi Red →
              </span>
              <span className="text-xs text-gray-500">Ver socios y niveles</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
