"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { buyProductAction } from "@/app/actions/product-actions";

type Props = {
  productId: string;
  productName: string;
};

export function BuyButton({ productId, productName }: Props) {
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleBuy() {
    setBuying(true);
    setResult(null);
    const res = await buyProductAction(productId);
    setBuying(false);
    setResult({
      ok: res.success,
      msg: res.success
        ? "¡Compra procesada! Las comisiones se han distribuido en la red."
        : res.error,
    });
    if (res.success) setTimeout(() => setResult(null), 6000);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleBuy}
        disabled={buying}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {buying ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingCart size={16} />
        )}
        {buying ? "Procesando compra…" : `Comprar ${productName}`}
      </button>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            result.ok
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {result.ok ? (
            <CheckCircle size={15} className="mt-px shrink-0" />
          ) : (
            <AlertCircle size={15} className="mt-px shrink-0" />
          )}
          {result.msg}
        </div>
      )}
    </div>
  );
}