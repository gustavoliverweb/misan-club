import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingCart, ArrowLeft, Tag, AlertCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getCartAction } from "@/app/actions/cart-actions";
import { CartItemControls } from "@/components/shop/cart-item-controls";
import { CheckoutButton } from "@/components/shop/checkout-button";
import { auth } from "@/auth";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type Props = {
  searchParams: Promise<{ canceled?: string }>;
};

export default async function CartPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { canceled } = await searchParams;

  const cart = await getCartAction();
  const items = cart?.items ?? [];
  const isSocioActivo = cart?.isSocioActivo ?? false;

  const total = items.reduce((sum, item) => {
    const price = isSocioActivo
      ? parseFloat(item.product.precioSocio)
      : parseFloat(item.product.precioPublico);
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-24">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft size={13} />
            Seguir comprando
          </Link>
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

        {/* Membership banner */}
        {isSocioActivo ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3 text-sm text-green-400">
            <Tag size={13} className="shrink-0" />
            Precios de socio activo aplicados
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-sm text-muted">
            <Tag size={13} className="shrink-0 text-accent" />
            <span>
              Estás viendo precios públicos.{" "}
              <Link href="/register" className="font-semibold text-fg hover:text-accent transition-colors">
                Hazte socio
              </Link>{" "}
              para precios exclusivos.
            </span>
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
            <Link
              href="/shop"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Ir al shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Items list */}
            <div className="space-y-3">
              {items.map((item) => {
                const price = isSocioActivo
                  ? parseFloat(item.product.precioSocio)
                  : parseFloat(item.product.precioPublico);
                const pvp = parseFloat(item.product.precioPublico);
                const socio = parseFloat(item.product.precioSocio);
                const saving = isSocioActivo && pvp > socio ? pvp - socio : 0;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-white/[0.07] bg-card p-4"
                  >
                    {/* Product image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-subtle">
                      {item.product.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imagen}
                          alt={item.product.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingCart size={20} className="text-faint" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/producto/${item.product.id}`}
                          className="text-sm font-medium text-fg leading-snug hover:text-accent transition-colors"
                        >
                          {item.product.nombre}
                        </Link>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-fg">
                            {fmt.format(price * item.quantity)}
                          </p>
                          {saving > 0 && (
                            <p className="text-[11px] text-green-400">
                              -{fmt.format(saving * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSocioActivo && pvp > socio && (
                        <p className="text-[11px] text-muted line-through">
                          PVP {fmt.format(pvp)} × {item.quantity}
                        </p>
                      )}

                      <CartItemControls
                        cartItemId={item.id}
                        initialQuantity={item.quantity}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="h-fit rounded-2xl border border-white/[0.07] bg-card p-6 space-y-4 lg:sticky lg:top-20">
              <h2 className="text-base font-semibold text-fg">Resumen del pedido</h2>

              <div className="space-y-2 border-t border-white/[0.05] pt-4">
                {items.map((item) => {
                  const price = isSocioActivo
                    ? parseFloat(item.product.precioSocio)
                    : parseFloat(item.product.precioPublico);
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs text-muted">
                      <span className="truncate max-w-[160px]">
                        {item.product.nombre} × {item.quantity}
                      </span>
                      <span className="shrink-0">{fmt.format(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                <span className="text-sm text-muted">Total</span>
                <span className="text-xl font-bold tracking-tight text-fg">
                  {fmt.format(total)}
                </span>
              </div>

              <p className="text-[11px] text-muted">IVA incluido · Pago seguro via Stripe</p>

              <CheckoutButton />

              <Link
                href="/shop"
                className="block text-center text-xs text-muted hover:text-fg transition-colors"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}
