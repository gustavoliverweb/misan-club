"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { addToStoreCartAction } from "@/app/actions/store-cart-actions";
import type { ProductRow } from "@/app/actions/product-actions";

type Props = {
  product: ProductRow;
  sellerId: string;
  inCart?: boolean;
};

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function StoreProductCard({ product, sellerId, inCart = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [addedToCart, setAddedToCart] = useState(inCart);

  const pvp = parseFloat(product.precioPublico);

  async function handleAdd() {
    setLoading(true);
    setResult(null);
    const res = await addToStoreCartAction(product.id, sellerId);
    setLoading(false);
    if (res.success) {
      setAddedToCart(true);
      setResult({ ok: true, msg: "Añadido al carrito" });
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult({ ok: false, msg: res.error });
    }
  }

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-card"
      style={{ boxShadow: "rgba(0,0,0,0.4) 0px 16px 40px -8px" }}
    >
      {/* Image */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-subtle">
        {product.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imagen}
            alt={product.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-faint">
            <ShoppingCart size={32} strokeWidth={1.5} />
            <span className="text-xs">{product.marca ?? "Producto"}</span>
          </div>
        )}

        {addedToCart && (
          <span className="absolute right-3 top-3 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-400 border border-green-500/20">
            En carrito
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {product.marca && (
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
            {product.marca}
          </span>
        )}

        <h3
          className="text-base font-bold leading-snug text-fg"
          style={{ letterSpacing: "-0.02em" }}
        >
          {product.nombre}
        </h3>

        {product.descripcion && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {product.descripcion}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto">
          <span
            className="text-2xl font-bold text-fg"
            style={{ letterSpacing: "-0.03em" }}
          >
            {fmt.format(pvp)}
            <span className="ml-1 text-sm font-normal text-muted">IVA inc.</span>
          </span>
        </div>

        {/* Feedback */}
        {result && (
          <div
            className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${
              result.ok
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {result.ok ? (
              <CheckCircle size={13} className="mt-px shrink-0" />
            ) : (
              <AlertCircle size={13} className="mt-px shrink-0" />
            )}
            {result.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShoppingCart size={14} />
            )}
            {loading ? "Añadiendo…" : addedToCart ? "Añadir otro" : "Añadir al carrito"}
          </button>

          <Link
            href={`/producto/${product.id}`}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
          >
            <Eye size={12} />
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
