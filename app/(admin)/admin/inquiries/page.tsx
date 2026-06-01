import { MessageSquare, ExternalLink } from "lucide-react";
import { desc } from "drizzle-orm";
import { db } from "@/infra/db";
import { contactRequests } from "@/infra/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const fmtDate = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminInquiriesPage() {
  const rows = await db
    .select()
    .from(contactRequests)
    .orderBy(desc(contactRequests.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare size={24} className="text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de información</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Consultas de visitantes sobre productos
          </p>
        </div>
        <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {rows.length} total
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No hay solicitudes todavía.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.productId ? (
                        <Link
                          href={`/producto/${r.productId}`}
                          target="_blank"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {r.productName}
                          <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span className="text-gray-500">{r.productName}</span>
                      )}
                    </TableCell>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${r.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.email}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-gray-600" title={r.mensaje}>
                        {r.mensaje}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {fmtDate.format(new Date(r.createdAt))}
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
