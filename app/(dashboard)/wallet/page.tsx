import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  FileDown,
  AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { WalletService } from "@/core/services/wallet.service";
import { db } from "@/infra/db";
import { transactions, autofacturas } from "@/infra/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BentoCard } from "@/components/ui/bento-card";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";

const walletService = new WalletService();

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fmtDate = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

  const domainTxs = txRows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount),
    referenceId: row.referenceId ?? undefined,
  }));

  const balance = walletService.computeBalance(domainTxs);

  const todayUTC = new Date().getUTCDate();
  const isWithdrawalWindow = todayUTC >= 1 && todayUTC <= 5;

  const recent = txRows.slice(0, 20);

  return (
    <div className="mx-auto max-w-2xl space-y-3">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Billetera</h1>
        <p className="mt-1 text-sm text-muted">Saldo y movimientos de tu cuenta</p>
      </div>

      {/* Balance card */}
      <BentoCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Saldo disponible
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight text-fg">
              {fmt.format(balance)}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {txRows.length} transacciones registradas
            </p>
          </div>
          <WalletIcon size={28} className="mb-1 text-faint" />
        </div>

        {balance < 50 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0 text-amber-500" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Necesitas un saldo mínimo de 50 € para solicitar un retiro.
            </p>
          </div>
        )}
      </BentoCard>

      {/* Withdrawal */}
      <BentoCard>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Solicitar retiro
        </p>
        <div className="mt-4">
          <WithdrawalForm
            balance={balance}
            kycStatus={user.kycStatus}
            isWithdrawalWindow={isWithdrawalWindow}
          />
        </div>
      </BentoCard>

      {/* Transactions table */}
      <BentoCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Últimos movimientos
          </p>
          <span className="tabular-nums text-sm text-faint">{recent.length}</span>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <WalletIcon size={36} className="text-faint" />
            <div>
              <p className="text-sm font-medium text-muted">Sin movimientos todavía</p>
              <p className="mt-1 text-xs text-faint">
                Las comisiones aparecerán aquí una vez proceses una venta.
              </p>
            </div>
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
                  <TableCell className="max-w-40 truncate font-medium text-fg">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {tx.type === "credit" ? (
                        <ArrowDownLeft size={14} className="text-green-500" />
                      ) : (
                        <ArrowUpRight size={14} className="text-red-500" />
                      )}
                      <Badge variant={tx.type === "credit" ? "success" : "error"}>
                        {tx.type === "credit" ? "Crédito" : "Débito"}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      tx.type === "credit" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "−"}
                    {fmt.format(parseFloat(tx.amount))}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted sm:table-cell">
                    {fmtDate.format(new Date(tx.createdAt))}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {tx.autofacturaId ? (
                      <a
                        href={`/api/autofacturas/${tx.autofacturaId}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/70"
                      >
                        <FileDown size={13} />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </BentoCard>
    </div>
  );
}
