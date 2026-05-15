import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { db } from "@/infra/db";
import { orders, orderItems, products } from "@/infra/db/schema";
import { auth } from "@/auth";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function PedidoPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { success } = await searchParams;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.userId !== session.user.id) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      isSocioPrice: orderItems.isSocioPrice,
      productId: products.id,
      nombre: products.nombre,
      imagen: products.imagen,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const isPaid = order.status === "paid";

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="mx-auto max-w-2xl px-6 pb-24 pt-24">
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
                Las comisiones de tu red se han distribuido automáticamente.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-card">
                <Package size={28} className="text-muted" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-fg">Pedido pendiente</h1>
              <p className="mt-2 text-sm text-muted">
                Estamos esperando la confirmación del pago.
              </p>
            </>
          )}
        </div>

        {/* Order card */}
        <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden">
          {/* Order meta */}
          <div className="border-b border-white/[0.05] px-6 py-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Pedido #{id.slice(0, 8).toUpperCase()}</span>
              <span>{new Date(order.createdAt).toLocaleDateString("es-ES")}</span>
            </div>
          </div>

          {/* Items */}
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
                    <p className="text-sm font-medium text-fg leading-snug">{item.nombre}</p>
                    <p className="text-xs text-muted">
                      {item.isSocioPrice ? "Precio socio" : "Precio público"} · ×{item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-fg">
                    {fmt.format(parseFloat(item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
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
            href="/shop"
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <ShoppingBag size={14} />
            Seguir comprando
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
          >
            Ver mi wallet
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
