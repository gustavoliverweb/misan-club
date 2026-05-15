import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getSubcategoriesAction } from "@/app/actions/product-actions";

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
    parentHref: "/misanshop/elixsia-cosmetics",
  },
  "misan-editorial": {
    label: "Misan Editorial",
    parentHref: "/misanshop/tu-biblioteca",
  },
};

const COLORS = [
  "rgba(0,153,255,0.06)",
  "rgba(0,153,255,0.04)",
  "rgba(0,153,255,0.06)",
  "rgba(0,153,255,0.04)",
];

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = { params: Promise<{ categoria: string; subcategoria: string }> };

export default async function SubcategoriaPage({ params }: Props) {
  const { categoria, subcategoria } = await params;
  const config = CATEGORY_CONFIG[categoria];
  const categoryLabel = config?.label ?? slugToLabel(categoria);
  const parentHref = config?.parentHref ?? "/shop";
  const subcatLabel = slugToLabel(subcategoria);
  const subs = await getSubcategoriesAction(categoria, subcategoria);

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
            <span className="text-fg">{subcatLabel}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-16 pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,153,255,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
              <Package size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {categoryLabel} · {subcatLabel}
              </span>
            </div>

            <h1
              className="max-w-xl font-bold text-fg"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              {subcatLabel}
            </h1>
          </div>
        </section>

        {/* Grid */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            {subs.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-card px-8 py-16 text-center">
                <p className="text-muted">No hay productos disponibles en este momento.</p>
              </div>
            ) : (
              <>
                <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Subcategorías
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subs.map(({ slug, count }, i) => (
                    <Link
                      key={slug}
                      href={`/categoria-producto/${categoria}/${subcategoria}/${slug}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] p-6 transition-colors hover:border-white/[0.12]"
                      style={{
                        background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${COLORS[i % COLORS.length]} 0%, transparent 70%), #090909`,
                        boxShadow: "rgba(0,0,0,0.35) 0px 16px 40px -8px",
                      }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                          <Package size={15} className="text-accent" />
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-faint transition-colors group-hover:text-accent"
                        />
                      </div>

                      <h2
                        className="mb-4 text-base font-bold text-fg"
                        style={{ letterSpacing: "-0.025em" }}
                      >
                        {slugToLabel(slug)}
                      </h2>

                      <span className="mt-auto self-start rounded-full border border-white/[0.07] bg-black px-2.5 py-1 text-[10px] font-medium text-muted">
                        {count} producto{count !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}