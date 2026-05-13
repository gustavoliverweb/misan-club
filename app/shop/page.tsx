import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getCountsByCategoriesAction } from "@/app/actions/product-actions";

const CATEGORIES = [
  {
    slug: "bienestar-en-casa",
    label: "Bienestar en Casa",
    description: "Agua, bienestar, confort, hogar y velas artesanales.",
    href: "/misanshop/bienestar-en-casa",
    color: "rgba(0,153,255,0.06)",
  },
  {
    slug: "complementos-nutricionales",
    label: "Complementos Nutricionales",
    description: "Suplementos de alta calidad para tu salud diaria.",
    href: "/misanshop/complementos-nutricionales",
    color: "rgba(0,153,255,0.04)",
  },
  {
    slug: "cursos-y-formaciones",
    label: "Cursos y Formaciones",
    description: "Academy, seminarios e inteligencia artificial.",
    href: "/formacion",
    color: "rgba(0,153,255,0.06)",
  },
  {
    slug: "elixsia-cosmetics",
    label: "Elixsia Cosmetics",
    description: "Cosmética exclusiva de alto rendimiento.",
    href: "/categoria-producto/elixsia-cosmetics",
    color: "rgba(0,153,255,0.04)",
  },
  {
    slug: "membresias",
    label: "Membresías",
    description: "Accede a todos los beneficios de MisanClub.",
    href: "/categoria-producto/membresias",
    color: "rgba(0,153,255,0.08)",
  },
  {
    slug: "misan-editorial",
    label: "Misan Editorial",
    description: "Libros y publicaciones de desarrollo personal.",
    href: "/categoria-producto/misan-editorial",
    color: "rgba(0,153,255,0.04)",
  },
  {
    slug: "inteligencia-artificial",
    label: "Servicios IA",
    description: "Consultoría, automatización y agentes de IA.",
    href: "/categoria-producto/cursos-y-formaciones/inteligencia-artificial",
    color: "rgba(0,153,255,0.06)",
  },
];

export default async function ShopPage() {
  const counts = await getCountsByCategoriesAction();
  const countsMap = Object.fromEntries(counts.map((r) => [r.categoria, r.count]));

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <span className="text-fg">Shop</span>
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
              <ShoppingBag size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Tu tienda · Formación · Comunidad
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
              Misan
              <br />
              Shop
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Calidad, innovación y exclusividad en un solo lugar.
              Los socios activos acceden a precios exclusivos y generan comisiones en cada venta de su red.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Categorías
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-card p-6 transition-colors hover:border-white/[0.12]"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cat.color} 0%, transparent 70%), #090909`,
                    boxShadow: "rgba(0,0,0,0.35) 0px 16px 40px -8px",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full border border-white/[0.07] bg-black px-2.5 py-1 text-[10px] font-medium text-muted">
                      {countsMap[cat.slug] ?? 0} productos
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-faint transition-colors group-hover:text-accent"
                    />
                  </div>

                  <h2
                    className="mb-2 text-lg font-bold text-fg"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    {cat.label}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}