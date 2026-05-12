import Link from "next/link";
import { ArrowRight, Clock, Lock, RefreshCw } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const programs = [
  {
    badge: "Dinero · Mentalidad",
    title: "Mentes Ricas, Ingresos Reales",
    description:
      "Taller práctico quincenal para mejorar tu relación con el dinero, eliminar creencias limitantes y aprender a vender productos reales.",
    href: "/formacion/misan-club-academy/mentes-ricas-ingresos-reales",
    tags: ["Online en directo", "Cada 15 días", "60–90 min"],
  },
  {
    badge: "Hábitos · Propósito",
    title: "Crecimiento Personal",
    description:
      "Talleres aplicables a la vida real para superar bloqueos, gestionar emociones y tomar decisiones alineadas con tu propósito.",
    href: "/formacion/misan-club-academy/crecimiento-personal",
    tags: ["Online en directo", "Cada 15 días", "60–90 min"],
  },
];

export default function AcademyPage() {
  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="transition-colors hover:text-fg">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/formacion" className="transition-colors hover:text-fg">
              Formación
            </Link>
            <span>/</span>
            <span className="text-fg">Misan Club Academy</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-20 pt-8">
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
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Formación continua · Solo socios
              </span>
            </div>

            <h1
              className="max-w-2xl font-bold text-fg"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              Misan Club
              <br />
              Academy
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Espacio de formación continua diseñado para impulsar el
              crecimiento económico y el desarrollo personal. Sesiones
              quincenales en directo con acceso a grabación.
            </p>

            {/* Format pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { Icon: Clock, label: "Sesiones de 60–90 min" },
                { Icon: RefreshCw, label: "Cada 15 días" },
                { Icon: Lock, label: "Acceso exclusivo socios" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2"
                >
                  <Icon size={12} className="text-accent" />
                  <span className="text-xs text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p
              className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent"
            >
              Programas
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {programs.map(({ badge, title, description, href, tags }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-card transition-colors hover:border-white/[0.12]"
                  style={{
                    boxShadow:
                      "rgba(0,153,255,0.12) 0px 0px 0px 1px inset, rgba(0,0,0,0.4) 0px 20px 48px -8px",
                  }}
                >
                  <div className="flex-1 p-7">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                      {badge}
                    </p>
                    <h2
                      className="mb-4 text-2xl font-bold text-fg"
                      style={{ letterSpacing: "-0.025em" }}
                    >
                      {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">
                      {description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.07] px-3 py-1 text-[11px] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-7 py-4">
                    <span className="text-xs text-muted">Ver programa</span>
                    <ArrowRight
                      size={14}
                      className="text-accent transition-transform group-hover:translate-x-0.5"
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
              className="overflow-hidden rounded-2xl px-8 py-12 text-center"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 100%, rgba(0,153,255,0.08) 0%, transparent 70%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                Acceso exclusivo para socios
              </p>
              <h2
                className="mx-auto max-w-sm font-bold text-fg"
                style={{
                  fontSize: "clamp(28px, 4vw, 42px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                Activa tu membresía
                <br />
                y empieza hoy.
              </h2>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Crear mi cuenta
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-full bg-white/10 px-7 text-sm font-medium text-fg transition-colors hover:bg-white/15"
                >
                  Ya tengo cuenta →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}