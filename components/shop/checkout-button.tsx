"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { createCartCheckoutSessionAction } from "@/app/actions/checkout-actions";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    const res = await createCartCheckoutSessionAction();
    if (res.success) {
      window.location.href = res.data.url;
    } else {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="flex h-13 items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CreditCard size={16} />
        )}
        {loading ? "Redirigiendo a pago…" : "Finalizar compra"}
      </button>

      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
