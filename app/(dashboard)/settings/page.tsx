import { redirect } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Nombre</span>
            <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Rol</span>
            <Badge variant="neutral" className="capitalize">{user.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">KYC</span>
            <Badge variant={user.kycStatus === "verified" ? "success" : user.kycStatus === "rejected" ? "error" : "warning"}>
              {user.kycStatus.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-gray-400">
          <SettingsIcon size={20} />
          <p className="text-sm">Más opciones de configuración disponibles próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
