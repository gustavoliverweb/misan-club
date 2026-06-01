"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Loader2, AlertCircle, Trash2, Plus, Minus } from "lucide-react";
import {
  getStoreCartAction,
  removeFromStoreCartAction,
  updateStoreCartQtyAction,
  type StoreCartItem,
} from "@/app/actions/store-cart-actions";
import { createStoreCheckoutSessionAction } from "@/app/actions/store-checkout-actions";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type Props = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ canceled?: string }>;
};

export default function StoreCartPage({ params, searchParams }: Props) {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [canceled, setCanceled] = useState(false);
  const [items, setItems] = useState<StoreCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPending, startCheckout] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [p, sp] = await Promise.all([params, searchParams]);
      setSellerId(p.userId);
      setCanceled(!!sp.canceled);

      const cart = await getStoreCartAction(p.userId);
      setItems(cart?.items ?? []);
      setLoading(false);
    }
    init();
  }, [params, searchParams]);

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.precioPublico) * item.qty,
    0,
  );

  async function handleRemove(productId: string) {
    await removeFromStoreCartAction(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleQty(productId: string, delta: number) {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = Math.max(1, Math.min(99, item.qty + delta));
    if (newQty === item.qty) return;
    await updateStoreCartQtyAction(productId, newQty);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: newQty } : i)),
    );
  }

  function handleCheckout() {
    if (!sellerId) return;
    setError(null);
    startCheckout(async () => {
      const res = await createStoreCheckoutSessionAction(sellerId);
      if (res.success) {
        router.push(res.data.url);
      } else {
        setError(res.error);
      }
    });
  }

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-black">
        <Loader2 size={20} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          {sellerId && (
            <Link
              href={`/tienda/${sellerId}`}
              className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft size={13} />
              Seguir comprando
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Mi carrito
          </h1>
          {items.length > 0 && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-0.5 text-xs text-muted">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </span>
          )}
        </div>

        {/* Canceled notice */}
        {canceled && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-400">
            <AlertCircle size={15} className="shrink-0" />
            Pago cancelado. Tu carrito sigue intacto.
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.07] bg-card">
              <ShoppingCart size={32} strokeWidth={1} className="text-faint" />
            </div>
            <div>
              <p className="text-lg font-semibold text-fg">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted">Explora el catálogo y añade productos</p>
            </div>
            {sellerId && (
              <Link
                href={`/tienda/${sellerId}`}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Ver catálogo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => {
                const pvp = parseFloat(item.precioPublico);
                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 rounded-2xl border border-white/[0.07] bg-card p-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-subtle">
                      {item.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingCart size={20} className="text-faint" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug text-fg">
                          {item.nombre}
                        </p>
                        <p className="shrink-0 text-sm font-bold text-fg">
                          {fmt.format(pvp * item.qty)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Qty controls */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-subtle px-2 py-1">
                          <button
                            onClick={() => handleQty(item.productId, -1)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-xs font-medium text-fg tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => handleQty(item.productId, 1)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-red-400"
                        >
                          <Trash2 size={11} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="h-fit rounded-2xl border border-white/[0.07] bg-card p-6 space-y-4 lg:sticky lg:top-6">
              <h2 className="text-base font-semibold text-fg">Resumen del pedido</h2>

              <div className="space-y-2 border-t border-white/[0.05] pt-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-xs text-muted"
                  >
                    <span className="max-w-[160px] truncate">
                      {item.nombre} × {item.qty}
                    </span>
                    <span className="shrink-0">
                      {fmt.format(parseFloat(item.precioPublico) * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                <span className="text-sm text-muted">Total</span>
                <span className="text-xl font-bold tracking-tight text-fg">
                  {fmt.format(total)}
                </span>
              </div>

              <p className="text-[11px] text-muted">IVA incluido · Pago seguro via Stripe</p>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">
                  <AlertCircle size={13} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checkoutPending || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {checkoutPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {checkoutPending ? "Redirigiendo…" : "Pagar"}
              </button>

              {sellerId && (
                <Link
                  href={`/tienda/${sellerId}`}
                  className="block text-center text-xs text-muted transition-colors hover:text-fg"
                >
                  Seguir comprando
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
