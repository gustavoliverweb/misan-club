import Link from "next/link";
import { BookOpen, ArrowRight, Lock } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const themes = [
  "Desarrollo personal",
  "Mentalidad emprendedora",
  "Nutrición",
  "Ventas",
  "Finanzas",
  "Hábitos",
];

const books = [
  {
    slug: "del-sofa-al-exito",
    title: "Del sofá al éxito",
    tagline: "Un viaje directo para dejar de poner excusas y empezar a actuar.",
    memberPrice: "14,40 €",
    href: "/categoria-producto/misan-editorial",
    color: "rgba(0,153,255,0.06)",
  },
  {
    slug: "renacer-sin-miedo",
    title: "Renacer sin miedo",
    tagline: "Guía práctica para superar el estancamiento y construir una nueva versión de ti mismo.",
    memberPrice: "12,40 €",
    href: "/categoria-producto/misan-editorial",
    color: "rgba(0,153,255,0.04)",
  },
];

export default function TuBibliotecaPage() {
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
            <span className="text-fg">Tu Biblioteca</span>
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
              <BookOpen size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Editorial · MisanShop
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
              Tu
              <br />
              Biblioteca
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              El conocimiento también se pone en la cesta.
              No se trata de tener muchos libros, sino los correctos que inspiren y transformen.
            </p>
          </div>
        </section>

        {/* Philosophy */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-5xl">
            <div
              className="rounded-2xl border border-white/[0.06] p-8 md:p-10"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,153,255,0.05) 0%, transparent 70%), #090909",
              }}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Filosofía
              </p>
              <p
                className="max-w-2xl text-xl font-bold text-fg"
                style={{ letterSpacing: "-0.025em", lineHeight: 1.3 }}
              >
                En MisanClub apostamos por el crecimiento de mente, cuerpo y bolsillo.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-white/[0.07] bg-black px-3 py-1 text-[11px] font-medium text-muted"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Books */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Catálogo destacado
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {books.map(({ slug, title, tagline, memberPrice, href, color }) => (
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
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black">
                      <BookOpen size={15} className="text-accent" />
                    </div>
                    <h2
                      className="mt-4 text-lg font-bold text-fg"
                      style={{ letterSpacing: "-0.025em" }}
                    >
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{tagline}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Lock size={11} className="text-faint" />
                      <span className="text-xs text-muted">Precio socio</span>
                      <span className="text-sm font-semibold text-accent">{memberPrice}</span>
                    </div>
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

        {/* CTA */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <div
              className="flex flex-col items-center rounded-2xl border border-white/[0.06] px-8 py-12 text-center"
              style={{ background: "#090909" }}
            >
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Precios exclusivos
              </p>
              <h2
                className="mb-4 max-w-sm text-2xl font-bold text-fg"
                style={{ letterSpacing: "-0.03em" }}
              >
                Hazte socio y accede a precios de miembro
              </h2>
              <p className="mb-8 max-w-md text-sm leading-relaxed text-muted">
                Los precios mostrados son exclusivos para socios activos. El envío es directo a tu domicilio.
              </p>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Unirse a MisanClub →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}