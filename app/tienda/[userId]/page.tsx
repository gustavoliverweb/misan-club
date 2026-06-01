import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Store, ShoppingCart } from "lucide-react";
import { db } from "@/infra/db";
import { products, users } from "@/infra/db/schema";
import { StoreProductCard } from "@/components/shop/store-product-card";
import { getStoreCartAction } from "@/app/actions/store-cart-actions";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function TiendaPage({ params }: Props) {
  const { userId } = await params;

  const [seller] = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!seller) notFound();

  const productList = await db
    .select()
    .from(products)
    .where(eq(products.active, true));

  const cart = await getStoreCartAction(userId);
  const cartProductIds = new Set(cart?.items.map((i) => i.productId) ?? []);
  const cartCount = cart?.items.reduce((s, i) => s + i.qty, 0) ?? 0;

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
              <Store size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted">Tienda de</p>
              <p className="text-sm font-semibold leading-none text-fg">{seller.fullName}</p>
            </div>
          </div>

          {cartCount > 0 && (
            <Link
              href={`/tienda/${userId}/cart`}
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <ShoppingCart size={14} />
              Carrito
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[10px] font-bold">
                {cartCount}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Catálogo
          </p>
          <h1
            className="mt-1 text-3xl font-bold text-fg"
            style={{ letterSpacing: "-0.04em" }}
          >
            Productos MisanClub
          </h1>
          <p className="mt-2 text-sm text-muted">
            {productList.length} {productList.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
        </div>

        {productList.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-card">
              <Store size={24} className="text-faint" />
            </div>
            <p className="text-sm text-muted">No hay productos disponibles por el momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productList.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                sellerId={userId}
                inCart={cartProductIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky cart bar (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/[0.06] bg-black/90 p-4 backdrop-blur-md sm:hidden">
          <Link
            href={`/tienda/${userId}/cart`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-black"
          >
            <ShoppingCart size={15} />
            Ver carrito · {cartCount} {cartCount === 1 ? "producto" : "productos"}
          </Link>
        </div>
      )}
    </div>
  );
}
