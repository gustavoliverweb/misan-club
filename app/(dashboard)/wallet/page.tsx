import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  FileDown,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { WalletService } from "@/core/services/wallet.service";
import { db } from "@/infra/db";
import { transactions, autofacturas } from "@/infra/db/schema";
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
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";

const walletService = new WalletService();

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});
const fmtDate = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // console.log("Current user:", user);
  const txRows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      referenceId: transactions.referenceId,
      checksum: transactions.checksum,
      createdAt: transactions.createdAt,
      autofacturaId: autofacturas.id,
    })
    .from(transactions)
    .leftJoin(autofacturas, eq(autofacturas.commissionId, transactions.id))
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt));

  // Map DB rows → domain Transaction type for WalletService (decimal string → number)
  const domainTxs = txRows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount),
    referenceId: row.referenceId ?? undefined,
  }));

  const balance = walletService.computeBalance(domainTxs);

  // Spec 03: window = days 1–5 of each month (UTC)
  const todayUTC = new Date().getUTCDate();
  const isWithdrawalWindow = todayUTC >= 1 && todayUTC <= 5;

  // Last 20 for display
  const recent = txRows.slice(0, 20);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billetera</h1>
        <p className="mt-1 text-sm text-gray-500">
          Saldo y movimientos de tu cuenta
        </p>
      </div>

      {/* ── Balance card ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gray-100 p-3">
              <WalletIcon size={28} className="text-gray-700" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-gray-900">
                {fmt.format(balance)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Calculado sobre {txRows.length} transacciones
              </p>
            </div>
          </div>
          {balance < 50 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Necesitas un saldo mínimo de 50 € para solicitar un retiro.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Withdrawal ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Retiro</CardTitle>
        </CardHeader>
        <CardContent>
          <WithdrawalForm
            balance={balance}
            kycStatus={user.kycStatus}
            isWithdrawalWindow={isWithdrawalWindow}
          />
        </CardContent>
      </Card>

      {/* ── Transactions list ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <WalletIcon size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Sin movimientos todavía
              </p>
              <p className="text-xs text-gray-400">
                Las comisiones aparecerán aquí una vez proceses una venta.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Factura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="max-w-40 truncate font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {tx.type === "credit" ? (
                          <ArrowDownLeft size={14} className="text-green-500" />
                        ) : (
                          <ArrowUpRight size={14} className="text-red-500" />
                        )}
                        <Badge
                          variant={tx.type === "credit" ? "success" : "error"}
                        >
                          {tx.type === "credit" ? "Crédito" : "Débito"}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${
                        tx.type === "credit" ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "−"}
                      {fmt.format(parseFloat(tx.amount))}
                    </TableCell>
                    <TableCell className="hidden text-xs text-gray-400 sm:table-cell">
                      {fmtDate.format(new Date(tx.createdAt))}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {tx.autofacturaId ? (
                        <a
                          href={`/api/autofacturas/${tx.autofacturaId}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FileDown size={13} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
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
