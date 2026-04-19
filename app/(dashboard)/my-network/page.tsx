import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/infra/db";
import { getDownline } from "@/infra/db/queries/downline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

const LEVEL_LABELS: Record<number, string> = {
  1: "Nivel 1",
  2: "Nivel 2",
  3: "Nivel 3",
  4: "Nivel 4",
  5: "Nivel 5",
};

// Visual weight per level — deeper = lighter colour
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  3: "bg-purple-100 text-purple-800 border-purple-200",
  4: "bg-violet-100 text-violet-800 border-violet-200",
  5: "bg-gray-100 text-gray-700 border-gray-200",
};

export default async function MyNetworkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Spec 01: recursive CTE, max 5 levels
  const downline = await getDownline(db, user.id);

  // Group by level for the summary row
  const byLevel = downline.reduce<Record<number, number>>((acc, m) => {
    acc[m.level] = (acc[m.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Red</h1>
        <p className="mt-1 text-sm text-gray-500">
          Socios en tu estructura descendente (máx. 5 niveles)
        </p>
      </div>

      {/* ── Level summary ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <Card key={lvl} className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-gray-900">{byLevel[lvl] ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-500">{LEVEL_LABELS[lvl]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Network table ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            Socios ({downline.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {downline.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Users size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Aún no tienes socios en tu red
              </p>
              <p className="text-xs text-gray-400">
                Comparte tu enlace de referido para empezar a construir tu red.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha de ingreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downline.map((member) => (
                  <TableRow key={member.memberId}>
                    {/* Spec: only display_name + join_date visible — no email/phone */}
                    <TableCell className="font-medium text-gray-900">
                      {member.fullName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LEVEL_COLORS[member.level]}`}
                      >
                        {LEVEL_LABELS[member.level]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                      {fmtDate.format(new Date(member.joinDate))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
