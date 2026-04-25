"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestWithdrawalFormAction } from "@/app/actions/wallet-actions";

interface WithdrawalFormProps {
  balance: number;
  kycStatus: "pending" | "verified" | "rejected";
  isWithdrawalWindow: boolean;
}

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function WithdrawalForm({ balance, kycStatus, isWithdrawalWindow }: WithdrawalFormProps) {
  const [state, formAction, pending] = useActionState(requestWithdrawalFormAction, undefined);

  const restriction =
    kycStatus !== "verified"
      ? "Verifica tu identidad (KYC) para poder retirar fondos."
      : !isWithdrawalWindow
        ? "Los retiros solo se procesan del día 1 al 5 de cada mes."
        : balance < 50
          ? `Necesitas un saldo mínimo de 50,00 € (tienes ${fmt.format(balance)}).`
          : null;

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 size={36} className="text-green-500" />
        <p className="font-medium text-fg">Solicitud enviada</p>
        <p className="text-sm text-muted">
          Tu retiro está en proceso. Se acreditará en los próximos días hábiles.
        </p>
      </div>
    );
  }

  if (restriction) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-subtle p-4">
        <Lock size={16} className="mt-0.5 shrink-0 text-faint" />
        <p className="text-sm text-muted">{restriction}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="withdrawal-amount"
          className="mb-1.5 block text-sm font-medium text-fg"
        >
          Importe a retirar (mín. 50,00 €)
        </label>
        <div className="relative">
          <input
            id="withdrawal-amount"
            name="amount"
            type="number"
            min="50"
            max={balance}
            step="0.01"
            required
            placeholder="0,00"
            className="w-full rounded-lg border border-border bg-card py-2 pl-3 pr-10 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-faint">
            EUR
          </span>
        </div>
        <p className="mt-1.5 text-xs text-faint">
          Saldo disponible: {fmt.format(balance)}
        </p>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Procesando..." : "Solicitar retiro"}
      </Button>
    </form>
  );
}
