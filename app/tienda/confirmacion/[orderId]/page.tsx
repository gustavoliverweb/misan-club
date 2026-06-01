import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { db } from "@/infra/db";
import { storeOrders, storeOrderItems, products, users } from "@/infra/db/schema";
import { ClearStoreCartOnMount } from "@/components/shop/clear-store-cart-on-mount";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function StoreConfirmationPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { success } = await searchParams;

  const [order] = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.id, orderId))
    .limit(1);

  if (!order) notFound();

  const [seller] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, order.sellerId))
    .limit(1);

  const items = await db
    .select({
      id: storeOrderItems.id,
      quantity: storeOrderItems.quantity,
      unitPrice: storeOrderItems.unitPrice,
      nombre: products.nombre,
      imagen: products.imagen,
    })
    .from(storeOrderItems)
    .innerJoin(products, eq(storeOrderItems.productId, products.id))
    .where(eq(storeOrderItems.orderId, orderId));

  const isPaid = order.status === "paid";

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      {isPaid && <ClearStoreCartOnMount />}

      <div className="mx-auto max-w-2xl px-6 pb-24 pt-16">
        {/* Status header */}
        <div className="mb-10 text-center">
          {isPaid ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-fg">
                {success ? "¡Pedido confirmado!" : "Pedido recibido"}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Gracias por tu compra en la tienda de{" "}
                <span className="font-medium text-fg">{seller?.fullName ?? "MisanClub"}</span>.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-card">
                <Package size={28} className="text-muted" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-fg">Pedido pendiente</h1>
              <p className="mt-2 text-sm text-muted">
                Esperando la confirmación del pago.
              </p>
            </>
          )}
        </div>

        {/* Order card */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-card">
          <div className="border-b border-white/[0.05] px-6 py-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Pedido #{orderId.slice(0, 8).toUpperCase()}</span>
              <span>{new Date(order.createdAt).toLocaleDateString("es-ES")}</span>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-subtle">
                  {item.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag size={16} className="text-faint" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium leading-snug text-fg">{item.nombre}</p>
                    <p className="text-xs text-muted">×{item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-fg">
                    {fmt.format(parseFloat(item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.05] px-6 py-4">
            <span className="text-sm text-muted">Total pagado</span>
            <span className="text-lg font-bold text-fg">
              {fmt.format(parseFloat(order.totalAmount))}
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/tienda/${order.sellerId}`}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <ShoppingBag size={14} />
            Seguir comprando
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
          >
            Ir al inicio
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
