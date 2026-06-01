import Link from "next/link";
import { ArrowRight, Droplets, Wind, Bed, Home, UtensilsCrossed, Flame, ShieldCheck, Leaf, TrendingUp } from "lucide-react";
import type { ElementType } from "react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getTopLevelSubcategoriesAction } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/current-user";

type SubMeta = { label: string; description: string; Icon: ElementType; href: string; color: string };

const SUBCATEGORY_META: Record<string, SubMeta> = {
  agua: {
    label: "Agua",
    description: "Sistemas de ósmosis y purificadores de agua.",
    Icon: Droplets,
    href: "/categoria-producto/bienestar-en-casa/agua",
    color: "rgba(0,153,255,0.06)",
  },
  bienestar: {
    label: "Bienestar",
    description: "Purificadores de aire, aromaterapia y dispositivos de ozono.",
    Icon: Wind,
    href: "/categoria-producto/bienestar-en-casa/bienestar",
    color: "rgba(0,153,255,0.04)",
  },
  confort: {
    label: "Confort",
    description: "Colchones ergonómicos de última generación y artículos de descanso.",
    Icon: Bed,
    href: "/categoria-producto/bienestar-en-casa/confort",
    color: "rgba(0,153,255,0.06)",
  },
  hogar: {
    label: "Hogar",
    description: "Aspiradores potentes y silenciosos, artículos de limpieza.",
    Icon: Home,
    href: "/categoria-producto/bienestar-en-casa/hogar",
    color: "rgba(0,153,255,0.04)",
  },
  "menaje-de-hogar": {
    label: "Menaje de Hogar",
    description: "Baterías de cocina y sartenes de alta calidad.",
    Icon: UtensilsCrossed,
    href: "/categoria-producto/bienestar-en-casa/menaje-de-hogar",
    color: "rgba(0,153,255,0.06)",
  },
  "velas-artesanales": {
    label: "Velas Artesanales",
    description: "Complementos aromáticos para el ambiente del hogar.",
    Icon: Flame,
    href: "/categoria-producto/bienestar-en-casa/velas-artesanales",
    color: "rgba(0,153,255,0.04)",
  },
};

const valueProps = [
  {
    Icon: ShieldCheck,
    title: "Ahorro",
    body: "Accede a precios exclusivos para socios, muy por debajo del mercado. Tu membresía se amortiza sola.",
  },
  {
    Icon: Leaf,
    title: "Salud",
    body: "Productos seleccionados para regenerar tu entorno físico y emocional. Calidad certificada.",
  },
  {
    Icon: TrendingUp,
    title: "Oportunidad",
    body: "Gana dinero recomendando. Comisiones de red activas hasta en 3 niveles por cada venta.",
  },
];

export default async function BienestarEnCasaPage() {
  const [user, dbSubs] = await Promise.all([
    getCurrentUser(),
    getTopLevelSubcategoriesAction("bienestar-en-casa"),
  ]);
  const isSocioActivo = user?.membership?.status === "active" || user?.membership?.status === "grace";
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
          <nav className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors hover:text-fg">Shop</Link>
            <span>/</span>
            <span className="text-fg">Bienestar en Casa</span>
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
              <Home size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Bienestar · MisanShop
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
              Bienestar
              <br />
              en Casa
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Convierte tu hogar en un espacio más saludable y ahorra mientras ganas dinero.
              El bienestar empieza en casa.
            </p>

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

        {/* Subcategory grid */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Categorías
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
                    {count} producto{count !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
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
              Por qué elegir MisanClub
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {valueProps.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.06] p-6"
                  style={{ background: "#090909" }}
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <h3
                    className="mb-2 text-base font-bold text-fg"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
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
                    Ya disfrutas de precios exclusivos
                  </h2>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                    Como socio activo accedes a los mejores precios y cada compra genera comisiones en tu red automáticamente.
                  </p>
                  <Link
                    href="/categoria-producto/bienestar-en-casa"
                    className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Ver todos los productos →
                  </Link>
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
                    Accede al precio de socio en todo el catálogo
                  </h2>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                    Los socios activos de MisanClub acceden a precios exclusivos muy por debajo del mercado y generan comisiones en cada recomendación de su red.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href="/register"
                      className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                    >
                      Unirse a MisanClub →
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-6 text-sm font-medium text-muted transition-colors hover:border-white/[0.18] hover:text-fg"
                    >
                      Iniciar sesión
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}