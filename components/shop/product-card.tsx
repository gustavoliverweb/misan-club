"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Eye, ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { addToCartAction } from "@/app/actions/cart-actions";
import type { ProductRow } from "@/app/actions/product-actions";

type Props = {
  product: ProductRow;
  isSocioActivo: boolean;
  isLoggedIn: boolean;
};

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function ProductCard({ product, isSocioActivo, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const pvp = parseFloat(product.precioPublico);
  const socio = parseFloat(product.precioSocio);
  const ahorro = pvp - socio;
  const ahorroPercent = Math.round((ahorro / pvp) * 100);

  const waText = encodeURIComponent(`Hola, me interesa el producto: ${product.nombre}`);
  const waHref = `https://wa.me/34600000000?text=${waText}`;

  async function handleAddToCart() {
    setLoading(true);
    setResult(null);
    const res = await addToCartAction(product.id);
    setLoading(false);
    setResult({
      ok: res.success,
      msg: res.success ? "Añadido al carrito" : res.error,
    });
    if (res.success) {
      window.dispatchEvent(new CustomEvent("cart:updated"));
      setTimeout(() => setResult(null), 4000);
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

        {/* Socio badge */}
        {isSocioActivo && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
            Precio socio
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

        {/* Pricing */}
        <div className="mt-auto space-y-1">
          {isSocioActivo ? (
            <>
              <div className="flex items-baseline gap-3">
                <span
                  className="text-2xl font-bold text-fg"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {fmt.format(socio)}
                </span>
                <span className="text-sm text-muted line-through">{fmt.format(pvp)}</span>
              </div>
              <p className="text-xs text-accent">
                Ahorro: {fmt.format(ahorro)} ({ahorroPercent}% descuento socio)
              </p>
            </>
          ) : (
            <span
              className="text-2xl font-bold text-fg"
              style={{ letterSpacing: "-0.03em" }}
            >
              {fmt.format(pvp)}
              <span className="ml-1 text-sm font-normal text-muted">IVA inc.</span>
            </span>
          )}
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
            {result.ok ? <CheckCircle size={13} className="mt-px shrink-0" /> : <AlertCircle size={13} className="mt-px shrink-0" />}
            {result.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isLoggedIn ? (
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShoppingCart size={14} />
              )}
              {loading ? "Añadiendo…" : "Agregar al carrito"}
            </button>
          ) : (
            <Link
              href={`/producto/${product.id}#solicitar`}
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 text-sm font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              <MessageCircle size={14} />
              Solicitar información
            </Link>
          )}

          <div className="flex gap-2">
            <Link
              href={`/producto/${product.id}`}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
            >
              <Eye size={12} />
              Ver detalle
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
            >
              <MessageCircle size={12} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}