import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Droplets,
  Sun,
  Leaf,
  Star,
  Wind,
  ShieldCheck,
  TrendingUp,
  Heart,
} from "lucide-react";
import type { ElementType } from "react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getTopLevelSubcategoriesAction } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/current-user";

type SubMeta = {
  label: string;
  description: string;
  Icon: ElementType;
  href: string;
  color: string;
};

const SUBCATEGORY_META: Record<string, SubMeta> = {
  "cuidado-facial": {
    label: "Cuidado Facial",
    description: "Sérum, hidratantes y tratamientos para una piel radiante y uniforme.",
    Icon: Sparkles,
    href: "/categoria-producto/elixsia-cosmetics/cuidado-facial",
    color: "rgba(0,153,255,0.07)",
  },
  "cuidado-corporal": {
    label: "Cuidado Corporal",
    description: "Cremas nutritivas, aceites y exfoliantes para una piel suave de pies a cabeza.",
    Icon: Droplets,
    href: "/categoria-producto/elixsia-cosmetics/cuidado-corporal",
    color: "rgba(0,153,255,0.04)",
  },
  "cuidado-capilar": {
    label: "Cuidado Capilar",
    description: "Champús, mascarillas y tratamientos para un cabello fuerte y luminoso.",
    Icon: Wind,
    href: "/categoria-producto/elixsia-cosmetics/cuidado-capilar",
    color: "rgba(0,153,255,0.07)",
  },
  antiedad: {
    label: "Antiedad",
    description: "Fórmulas avanzadas con retinol, ácido hialurónico y péptidos bioactivos.",
    Icon: Sun,
    href: "/categoria-producto/elixsia-cosmetics/antiedad",
    color: "rgba(0,153,255,0.04)",
  },
  natural: {
    label: "Línea Natural",
    description: "Cosmética ecológica certificada con ingredientes 100% de origen vegetal.",
    Icon: Leaf,
    href: "/categoria-producto/elixsia-cosmetics/natural",
    color: "rgba(0,153,255,0.07)",
  },
  premium: {
    label: "Edición Premium",
    description: "Rituales de lujo con activos exclusivos para resultados visibles desde la primera aplicación.",
    Icon: Star,
    href: "/categoria-producto/elixsia-cosmetics/premium",
    color: "rgba(0,153,255,0.04)",
  },
};

const pillars = [
  {
    Icon: Leaf,
    title: "Ingredientes naturales",
    body: "Cada fórmula está elaborada con activos de origen vegetal y biotecnológico, libres de parabenos y sulfatos.",
  },
  {
    Icon: ShieldCheck,
    title: "Testado dermatológicamente",
    body: "Todos los productos superan pruebas clínicas de eficacia y tolerancia cutánea antes de llegar a ti.",
  },
  {
    Icon: Heart,
    title: "Cosmética sostenible",
    body: "Envases reciclables, formulaciones biodegradables y compromiso con la huella de carbono mínima.",
  },
  {
    Icon: TrendingUp,
    title: "Precio de socio",
    body: "Como miembro activo de MisanClub accedes a precios exclusivos y generas comisiones en tu red.",
  },
];

export default async function ElixsiaCosmeticsPage() {
  const [user, dbSubs] = await Promise.all([
    getCurrentUser(),
    getTopLevelSubcategoriesAction("elixsia-cosmetics"),
  ]);
  const isSocioActivo = user?.membership?.status === "active";
  const countsMap = Object.fromEntries(dbSubs.map((r) => [r.slug, r.count]));

  const subcategories = Object.entries(SUBCATEGORY_META).map(([slug, meta]) => ({
    slug,
    ...meta,
    count: countsMap[slug] ?? 0,
  }));

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors hover:text-fg">Shop</Link>
            <span>/</span>
            <span className="text-fg">Elixsia Cosmetics</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-16 pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,153,255,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
              <Sparkles size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Cosmética · MisanShop
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
              Elixsia
              <br />
              Cosmetics
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Cosmética de alta eficacia con ingredientes activos seleccionados.
              Rituales de belleza que cuidan tu piel desde adentro hacia afuera.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/categoria-producto/elixsia-cosmetics"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Ver catálogo <ArrowRight size={13} />
              </Link>
              {!isSocioActivo && (
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.18] hover:text-fg"
                >
                  Precios de socio
                </Link>
              )}
            </div>

            {!isSocioActivo && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card px-5 py-3.5">
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
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/[0.06] px-5 py-3.5">
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

        {/* Subcategory grid */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Líneas de producto
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subcategories.map(({ slug, label, count, description, Icon, href, color }) => (
                <Link
                  key={slug}
                  href={href}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] p-6 transition-colors hover:border-white/[0.12]"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${color} 0%, transparent 70%), #090909`,
                    boxShadow: "rgba(0,0,0,0.35) 0px 16px 40px -8px",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                      <Icon size={15} className="text-accent" />
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-faint transition-colors group-hover:text-accent"
                    />
                  </div>

                  <h2
                    className="mb-1 text-base font-bold text-fg"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    {label}
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-muted">{description}</p>

                  <span className="mt-auto self-start rounded-full border border-white/[0.07] bg-black px-2.5 py-1 text-[10px] font-medium text-muted">
                    {count > 0
                      ? `${count} producto${count !== 1 ? "s" : ""}`
                      : "Próximamente"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy banner */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <div
              className="rounded-2xl border border-white/[0.06] p-8 md:p-10"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,153,255,0.05) 0%, transparent 70%), #090909",
              }}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Filosofía Elixsia
              </p>
              <p
                className="max-w-2xl text-xl font-bold text-fg"
                style={{ letterSpacing: "-0.025em", lineHeight: 1.3 }}
              >
                La verdadera belleza nace del equilibrio entre la naturaleza,
                la ciencia y el cuidado consciente de uno mismo.
              </p>
            </div>
          </div>
        </section>

        {/* 4-pillar grid */}
        <section className="relative px-6 pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,153,255,0.04) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Nuestros pilares
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.06] p-5"
                  style={{ background: "#090909" }}
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <h3
                    className="mb-2 text-sm font-bold text-fg"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <div
              className="flex flex-col items-center rounded-2xl border border-white/[0.06] px-8 py-12 text-center"
              style={{ background: "#090909" }}
            >
              {isSocioActivo ? (
                <>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                      Socio activo
                    </span>
                  </div>
                  <h2
                    className="mb-4 max-w-sm text-2xl font-bold text-fg"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    Ya disfrutas de precios exclusivos Elixsia
                  </h2>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                    Como socio activo accedes a los mejores precios y cada compra genera comisiones en tu red automáticamente.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                    Precios exclusivos para socios
                  </p>
                  <h2
                    className="mb-4 max-w-sm text-2xl font-bold text-fg"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    Accede al precio de socio en toda la línea Elixsia
                  </h2>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                    Los socios activos de MisanClub acceden a precios exclusivos muy por debajo del
                    mercado y generan comisiones en cada recomendación de su red.
                  </p>
                </>
              )}
              {isSocioActivo ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/categoria-producto/elixsia-cosmetics"
                    className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Ver todos los productos →
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex h-10 items-center rounded-full border border-white/[0.1] bg-transparent px-6 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-fg"
                  >
                    Mi cuenta
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Unirse a MisanClub →
                  </Link>
                  <Link
                    href="/categoria-producto/elixsia-cosmetics"
                    className="inline-flex h-10 items-center rounded-full border border-white/[0.1] bg-transparent px-6 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-fg"
                  >
                    Ver todos los productos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}