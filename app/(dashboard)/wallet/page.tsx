import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import {
  ArrowUpRight,
  ShoppingBag,
  Wallet as WalletIcon,
  FileDown,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { WalletService } from "@/core/services/wallet.service";
import { db } from "@/infra/db";
import { transactions, purchaseInvoices } from "@/infra/db/schema";
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

  // All transactions — used only for balance computation
  const allTxRows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      referenceId: transactions.referenceId,
      checksum: transactions.checksum,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt));

  const domainTxs = allTxRows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount),
    referenceId: row.referenceId ?? undefined,
  }));

  const balance = walletService.computeBalance(domainTxs);

  const todayUTC = new Date().getUTCDate();
  const isWithdrawalWindow = todayUTC >= 1 && todayUTC <= 5;

  // Only withdrawal transactions shown in movements
  const withdrawalTxs = allTxRows.filter(
    (tx) => tx.description === "Solicitud de retiro",
  );

  // Store sale earnings: credits from selling through personal store link
  const saleEarningTxs = allTxRows.filter(
    (tx) =>
      tx.type === "credit" &&
      (tx.description.startsWith("Margen venta pública") ||
        tx.description.startsWith("Margen directo") ||
        tx.description.startsWith("Comisión venta en tienda")),
  );

  // Purchase invoices for this user
  const purchaseRows = await db
    .select({
      id: purchaseInvoices.id,
      concepto: purchaseInvoices.concepto,
      totalAmount: purchaseInvoices.totalAmount,
      issuedAt: purchaseInvoices.issuedAt,
    })
    .from(purchaseInvoices)
    .where(eq(purchaseInvoices.userId, user.id))
    .orderBy(desc(purchaseInvoices.issuedAt));

  type WithdrawalEntry = {
    kind: "withdrawal";
    id: string;
    amount: string;
    date: Date;
  };
  type PurchaseEntry = {
    kind: "purchase";
    id: string;
    concepto: string;
    totalAmount: string;
    date: Date;
  };
  type SaleEntry = {
    kind: "sale";
    id: string;
    amount: string;
    date: Date;
  };
  type Movement = WithdrawalEntry | PurchaseEntry | SaleEntry;

  const movements: Movement[] = [
    ...withdrawalTxs.map((tx) => ({
      kind: "withdrawal" as const,
      id: tx.id,
      amount: tx.amount,
      date: tx.createdAt,
    })),
    ...purchaseRows.map((pi) => ({
      kind: "purchase" as const,
      id: pi.id,
      concepto: pi.concepto,
      totalAmount: pi.totalAmount,
      date: pi.issuedAt,
    })),
    ...saleEarningTxs.map((tx) => ({
      kind: "sale" as const,
      id: tx.id,
      amount: tx.amount,
      date: tx.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

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
              {allTxRows.length} transacciones registradas
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

      {/* Movements table */}
      <BentoCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Últimos movimientos
          </p>
          <span className="tabular-nums text-sm text-faint">{movements.length}</span>
        </div>

        {movements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <WalletIcon size={36} className="text-faint" />
            <div>
              <p className="text-sm font-medium text-muted">Sin movimientos todavía</p>
              <p className="mt-1 text-xs text-faint">
                Tus retiros y compras aparecerán aquí.
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
              {movements.map((mv) => {
                if (mv.kind === "withdrawal") {
                  return (
                    <TableRow key={mv.id}>
                      <TableCell className="max-w-40 truncate font-medium text-fg">
                        Solicitud de retiro
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <ArrowUpRight size={14} className="text-red-500" />
                          <Badge variant="error">Retiro</Badge>
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red-500">
                        −{fmt.format(parseFloat(mv.amount))}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted sm:table-cell">
                        {fmtDate.format(new Date(mv.date))}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <a
                          href={`/api/withdrawals/${mv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/70"
                        >
                          <FileDown size={13} />
                          PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                }

                if (mv.kind === "sale") {
                  return (
                    <TableRow key={mv.id}>
                      <TableCell className="max-w-40 truncate font-medium text-fg">
                        Venta en tienda personal
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <TrendingUp size={14} className="text-green-500" />
                          <Badge variant="success">Venta</Badge>
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-green-500">
                        +{fmt.format(parseFloat(mv.amount))}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted sm:table-cell">
                        {fmtDate.format(new Date(mv.date))}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <a
                          href={`/api/commissions/${mv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/70"
                        >
                          <FileDown size={13} />
                          PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={mv.id}>
                    <TableCell className="max-w-40 truncate font-medium text-fg">
                      {mv.concepto}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={14} className="text-accent" />
                        <Badge variant="neutral">Compra</Badge>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-fg">
                      {fmt.format(parseFloat(mv.totalAmount))}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted sm:table-cell">
                      {fmtDate.format(new Date(mv.date))}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <a
                        href={`/api/purchase-invoices/${mv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/70"
                      >
                        <FileDown size={13} />
                        PDF
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </BentoCard>
    </div>
  );
}
