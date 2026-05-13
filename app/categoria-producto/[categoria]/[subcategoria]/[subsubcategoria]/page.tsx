import Link from "next/link";
import { Package } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ProductCard } from "@/components/shop/product-card";
import { getProductsBySlugAction } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/current-user";

const CATEGORY_CONFIG: Record<string, { label: string; parentHref: string }> = {
  "bienestar-en-casa": {
    label: "Bienestar en Casa",
    parentHref: "/misanshop/bienestar-en-casa",
  },
  "complementos-nutricionales": {
    label: "Complementos Nutricionales",
    parentHref: "/misanshop/complementos-nutricionales",
  },
  "elixsia-cosmetics": {
    label: "Elixsia Cosmetics",
    parentHref: "/shop",
  },
  "misan-editorial": {
    label: "Misan Editorial",
    parentHref: "/misanshop/tu-biblioteca",
  },
};

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  params: Promise<{
    categoria: string;
    subcategoria: string;
    subsubcategoria: string;
  }>;
};

export default async function SubsubcategoriaPage({ params }: Props) {
  const { categoria, subcategoria, subsubcategoria } = await params;

  const [user, productList] = await Promise.all([
    getCurrentUser(),
    getProductsBySlugAction(categoria, `${subcategoria}/${subsubcategoria}`),
  ]);

  const isSocioActivo = user?.membership?.status === "active";
  const config = CATEGORY_CONFIG[categoria];
  const categoryLabel = config?.label ?? slugToLabel(categoria);
  const parentHref = config?.parentHref ?? "/shop";
  const subcatLabel = slugToLabel(subcategoria);
  const subsubcatLabel = slugToLabel(subsubcategoria);

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors hover:text-fg">Shop</Link>
            <span>/</span>
            <Link href={parentHref} className="transition-colors hover:text-fg">
              {categoryLabel}
            </Link>
            <span>/</span>
            <Link
              href={`/categoria-producto/${categoria}/${subcategoria}`}
              className="transition-colors hover:text-fg"
            >
              {subcatLabel}
            </Link>
            <span>/</span>
            <span className="text-fg">{subsubcatLabel}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-12 pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,153,255,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
              <Package size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {subcatLabel} · {subsubcatLabel}
              </span>
            </div>

            <h1
              className="max-w-xl font-bold text-fg"
              style={{
                fontSize: "clamp(36px, 5vw, 62px)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              {subsubcatLabel}
            </h1>

            {!isSocioActivo && (
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card px-5 py-3.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm text-muted">
                  <Link
                    href="/register"
                    className="font-semibold text-fg transition-colors hover:text-accent"
                  >
                    Hazte socio
                  </Link>{" "}
                  para ver precios exclusivos y generar comisiones en tu red.
                </p>
              </div>
            )}

            {isSocioActivo && (
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/[0.06] px-5 py-3.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm text-muted">
                  Estás viendo{" "}
                  <span className="font-semibold text-accent">precios de socio</span>.
                  Al comprar, las comisiones se distribuyen en tu red automáticamente.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Products */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-8 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              {productList.length} producto{productList.length !== 1 ? "s" : ""}
            </p>

            {productList.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-card px-8 py-16 text-center">
                <p className="text-muted">No hay productos disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {productList.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSocioActivo={isSocioActivo}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}