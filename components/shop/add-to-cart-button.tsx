"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart-actions";

type Props = {
  productId: string;
  label?: string;
};

export function AddToCartButton({ productId, label = "Agregar al carrito" }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleAdd() {
    setLoading(true);
    setResult(null);
    const res = await addToCartAction(productId);
    setLoading(false);
    setResult({
      ok: res.success,
      msg: res.success ? "Producto añadido al carrito" : res.error,
    });
    if (res.success) {
      window.dispatchEvent(new CustomEvent("cart:updated"));
      setTimeout(() => setResult(null), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAdd}
        disabled={loading}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingCart size={16} />
        )}
        {loading ? "Añadiendo…" : label}
      </button>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            result.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
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
