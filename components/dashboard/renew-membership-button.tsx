"use client";

import { useActionState, useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { renewMembershipAction } from "@/app/actions/wallet-actions";

export function RenewMembershipButton({ label = "Renovar membresía — 30 €" }: { label?: string }) {
  const [state, action, isPending] = useActionState(renewMembershipAction, undefined);

  useEffect(() => {
    if (state?.checkoutUrl) {
      window.location.href = state.checkoutUrl;
    }
  }, [state?.checkoutUrl]);

  const redirecting = Boolean(state?.checkoutUrl);

  return (
    <form action={action} className="mt-4 space-y-3">
      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={isPending || redirecting}
        className="flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <RefreshCw size={13} className={isPending || redirecting ? "animate-spin" : ""} />
        {redirecting
          ? "Redirigiendo a Stripe..."
          : isPending
          ? "Procesando..."
          : label}
      </button>
    </form>
  );
}
