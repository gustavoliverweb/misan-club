import Link from "next/link";
import { Leaf, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getCurrentUser } from "@/lib/current-user";

const lines = [
  {
    slug: "herbora",
    brand: "HERBORA",
    tagline: "Bienestar natural, día a día.",
    description:
      "Ingredientes de origen vegetal para el equilibrio integral del organismo. Una línea que combina la tradición herbal con la formulación moderna.",
    Icon: Leaf,
    color: "rgba(0,153,255,0.06)",
    href: "/categoria-producto/complementos-nutricionales",
  },
  {
    slug: "pwd-nutrition",
    brand: "PWD Nutrition",
    tagline: "Nutrición que impulsa tu bienestar.",
    description:
      "Fórmulas innovadoras respaldadas por la ciencia para el rendimiento y la dietética. Diseñadas para quienes buscan resultados reales.",
    Icon: FlaskConical,
    color: "rgba(0,153,255,0.04)",
    href: "/categoria-producto/complementos-nutricionales",
  },
];

const benefits = [
  {
    title: "Sistema inmunológico",
    body: "Refuerza tus defensas naturales con formulaciones de alta biodisponibilidad.",
  },
  {
    title: "Rendimiento físico",
    body: "Mejora tu energía, resistencia y recuperación con nutrientes de calidad certificada.",
  },
  {
    title: "Equilibrio nutricional",
    body: "Cubre carencias específicas con suplementos precisos, sin rellenos ni aditivos.",
  },
];

export default async function ComplementosNutricionalesPage() {
  const user = await getCurrentUser();
  const isSocioActivo = user?.membership?.status === "active" || user?.membership?.status === "grace";

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
            <span className="text-fg">Complementos Nutricionales</span>
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
              <Leaf size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Nutrición · MisanShop
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
              Complementos
              <br />
              Nutricionales
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              El apoyo perfecto para cuidar tu salud y potenciar tu bienestar cada día.
              Naturaleza y ciencia en cada cápsula.
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

        {/* Brand lines */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Líneas destacadas
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {lines.map(({ slug, brand, tagline, description, Icon, color, href }) => (
                <Link
                  key={slug}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] transition-colors hover:border-white/[0.12]"
                  style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${color} 0%, transparent 70%), #090909`,
                    boxShadow: "rgba(0,0,0,0.35) 0px 16px 40px -8px",
                  }}
                >
                  <div className="flex-1 p-6">
                    <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                      <Icon size={15} className="text-accent" />
                    </div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                      {brand}
                    </p>
                    <h2
                      className="mb-2 text-lg font-bold text-fg"
                      style={{ letterSpacing: "-0.025em" }}
                    >
                      {tagline}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">{description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
                    <span className="text-xs text-muted">Ver productos</span>
                    <ArrowRight
                      size={14}
                      className="text-faint transition-colors group-hover:text-accent"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Commitment banner */}
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
                Nuestro compromiso
              </p>
              <p
                className="max-w-2xl text-xl font-bold text-fg"
                style={{ letterSpacing: "-0.025em", lineHeight: 1.3 }}
              >
                Combinamos naturaleza y ciencia para ofrecer soluciones eficaces
                y seguras para una salud equilibrada.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {benefits.map(({ title, body }) => (
                  <div key={title} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="shrink-0 text-accent" />
                      <span className="text-sm font-semibold text-fg">{title}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{body}</p>
                  </div>
                ))}
              </div>
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
                    href="/categoria-producto/complementos-nutricionales"
                    className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Ver todos los suplementos →
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
                    Accede al precio de socio en todos los suplementos
                  </h2>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                    Los socios activos acceden a precios por debajo del mercado y generan comisiones en cada recomendación de su red.
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