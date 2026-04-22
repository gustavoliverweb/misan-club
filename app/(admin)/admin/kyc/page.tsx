import { FileText, UserCheck, ExternalLink } from "lucide-react";
import { getPendingKycSubmissions } from "@/infra/db/queries/kyc";
import { KycReviewActions } from "@/components/admin/kyc-review-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmtDate = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DOC_TYPE_LABELS: Record<string, string> = {
  dni_front: "DNI (anverso)",
  dni_back: "DNI (reverso)",
  passport: "Pasaporte",
  selfie: "Selfie",
};

export default async function AdminKycPage() {
  const submissions = await getPendingKycSubmissions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck size={24} className="text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revisión KYC</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Documentos pendientes de verificación
          </p>
        </div>
        {submissions.length > 0 && (
          <Badge variant="warning" className="ml-auto">
            {submissions.length} pendiente{submissions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes pendientes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <UserCheck size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Sin solicitudes pendientes
              </p>
              <p className="text-xs text-gray-400">
                Todas las solicitudes KYC han sido revisadas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Enviado
                  </TableHead>
                  <TableHead>Ver</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id} className="align-top">
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {sub.userFullName}
                      </p>
                      <p className="text-xs text-gray-500">{sub.userEmail}</p>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <FileText size={14} className="text-gray-400" />
                        {DOC_TYPE_LABELS[sub.documentType] ?? sub.documentType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-xs text-gray-400 sm:table-cell">
                      {fmtDate.format(new Date(sub.submittedAt))}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/api/admin/kyc/${sub.id}/document`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink size={13} />
                        Abrir
                      </a>
                    </TableCell>
                    <TableCell>
                      <KycReviewActions submissionId={sub.id} />
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
