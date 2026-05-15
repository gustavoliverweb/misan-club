import Link from "next/link";
import { Zap, CalendarDays, Timer, ShieldCheck, EyeOff, CheckCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getCurrentUser } from "@/lib/current-user";

const howItWorks = [
  {
    Icon: CalendarDays,
    title: "Cada lunes",
    body: "Una oferta única y sorprendente se activa a las 00:00. Válida solo 7 días o hasta agotar existencias.",
  },
  {
    Icon: Zap,
    title: "Solo para socios",
    body: "Productos de bienestar, tecnología, belleza, hogar o escapadas a precios que no encontrarás en ningún otro sitio.",
  },
  {
    Icon: Timer,
    title: "Corre o pierdes",
    body: "Sin segunda oportunidad. Los socios que se mueven rápido son los que más ahorran. Es una experiencia de sorpresa y valor comunitario.",
  },
];

const testimonials = [
  {
    quote: "Ahorro más de 200 € al mes solo con las ofertas semanales. La membresía se paga sola.",
    author: "Socio activo, Madrid",
  },
  {
    quote: "Es como tener un pase VIP al ahorro. Cada lunes es la mejor parte de la semana.",
    author: "Socio activo, Barcelona",
  },
];

export default async function ElOfertonPage() {
  const user = await getCurrentUser();
  const isSocioActivo = user?.membership?.status === "active";

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
            <span className="text-fg">El Ofertón</span>
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
              <Zap size={11} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Oferta de la semana · Solo socios
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
              El
              <br />
              Ofertón
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              El chollo de la semana… solo para socios.
              Cada lunes una oportunidad nueva, cada viernes una oportunidad perdida.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Cómo funciona
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {howItWorks.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="flex flex-col rounded-2xl border border-white/[0.06] p-6"
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

        {/* Offer teaser */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Oferta de esta semana
            </p>

            {isSocioActivo ? (
              <div
                className="flex flex-col items-center gap-5 rounded-2xl border border-accent/20 p-10 text-center"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,153,255,0.06) 0%, transparent 70%), #090909",
                  boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px",
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.06]">
                  <CheckCircle size={20} className="text-accent" />
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold text-fg">Eres socio activo</p>
                  <p className="max-w-sm text-xs leading-relaxed text-muted">
                    Las ofertas semanales se publican cada lunes a las 00:00.
                    Mantente atento — los socios que actúan rápido son los que más ahorran.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex h-9 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Explorar el shop
                </Link>
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,153,255,0.06) 0%, transparent 70%), #090909",
                  boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px",
                }}
              >
                {/* Blurred content behind the lock */}
                <div className="select-none p-8 blur-sm" aria-hidden>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-accent">
                    Esta semana
                  </p>
                  <h3
                    className="mb-3 text-2xl font-bold text-fg"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    ████████ ██████████
                  </h3>
                  <p className="max-w-md text-sm text-muted">
                    ████ ████████ ████ ██ ██████████ ████ ████ ████████ ████ ██ ██████████.
                  </p>
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-fg">███ €</span>
                    <span className="text-sm text-muted line-through">███ €</span>
                  </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-[2px] p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                    <EyeOff size={20} className="text-muted" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-fg">Contenido exclusivo para socios</p>
                    <p className="text-xs text-muted">
                      Inicia sesión o únete para descubrir la oferta de esta semana
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                    >
                      Descúbrelo ahora
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex h-9 items-center rounded-full border border-white/[0.12] bg-white/[0.05] px-5 text-sm font-medium text-fg transition-colors hover:bg-white/[0.08]"
                    >
                      Unirme al club
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Lo que dicen los socios
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {testimonials.map(({ quote, author }) => (
                <div
                  key={author}
                  className="rounded-2xl border border-white/[0.06] p-6"
                  style={{ background: "#090909" }}
                >
                  <div className="mb-4 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <ShieldCheck key={i} size={12} className="text-accent" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-fg">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted">{author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}