import Link from "next/link";
import { ArrowRight, Clock, Laptop, RefreshCw, Lock } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const contenidos = [
  "Superar bloqueos mentales y emocionales que frenan tu avance",
  "Gestionar emociones con herramientas prácticas",
  "Tomar decisiones alineadas con tu propósito real",
  "Salir del piloto automático y vivir con intención",
  "Mejorar hábitos, energía vital y foco personal",
];

export default function CrecimientoPersonalPage() {
  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <Link href="/formacion" className="transition-colors hover:text-fg">Formación</Link>
            <span>/</span>
            <Link href="/formacion/misan-club-academy" className="transition-colors hover:text-fg">
              Misan Club Academy
            </Link>
            <span>/</span>
            <span className="text-fg">Crecimiento Personal</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative px-6 pb-16 pt-8">
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
                Hábitos · Propósito · Solo socios
              </span>
            </div>

            <h1
              className="max-w-2xl font-bold text-fg"
              style={{
                fontSize: "clamp(36px, 5.5vw, 68px)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              Crecimiento
              <br />
              Personal
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Un espacio de evolución continua para personas que quieren más.
              Sesiones quincenales online para superar bloqueos, gestionar
              emociones y tomar decisiones alineadas con el propósito.
            </p>
          </div>
        </section>

        {/* Format + Content */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">

              {/* Format card */}
              <div
                className="md:col-span-2 rounded-2xl border border-white/[0.06] bg-card p-7"
                style={{
                  boxShadow:
                    "rgba(0,153,255,0.15) 0px 0px 0px 1px inset, rgba(0,0,0,0.4) 0px 20px 48px -8px",
                }}
              >
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Formato
                </p>
                <div className="space-y-5">
                  {[
                    { Icon: Laptop, label: "Modalidad", value: "Online en directo" },
                    { Icon: RefreshCw, label: "Frecuencia", value: "Cada 15 días" },
                    { Icon: Clock, label: "Duración", value: "60–90 min por sesión" },
                    { Icon: Lock, label: "Acceso", value: "Solo socios activos" },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-black">
                        <Icon size={12} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted">{label}</p>
                        <p className="mt-0.5 text-sm font-medium text-fg">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <p className="text-xs text-muted">
                    Acceso a grabación incluido en cada sesión.
                  </p>
                </div>
              </div>

              {/* Content card */}
              <div
                className="md:col-span-3 rounded-2xl border border-white/[0.06] bg-card p-7"
                style={{ boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px" }}
              >
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Qué trabajarás
                </p>
                <ul className="space-y-3">
                  {contenidos.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-accent/60" />
                      <span className="text-sm leading-relaxed text-muted">{item}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-8 rounded-xl p-5"
                  style={{ background: "rgba(0,153,255,0.05)", border: "1px solid rgba(0,153,255,0.12)" }}
                >
                  <p className="text-sm font-medium text-fg">
                    Perfil del participante
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Para personas dispuestas a invertir tiempo en sí mismas
                    y que buscan vivir con mayor claridad, energía y propósito.
                    No se requiere experiencia previa.
                  </p>
                </div>
              </div>
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
              <h2
                className="mx-auto max-w-sm font-bold text-fg"
                style={{
                  fontSize: "clamp(28px, 4vw, 42px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                Empieza a vivir
                <br />
                con propósito.
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Activa tu membresía y accede a este programa junto a todos los
                recursos de MisanClub.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Activar membresía
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/formacion/misan-club-academy"
                  className="inline-flex h-11 items-center rounded-full bg-white/10 px-7 text-sm font-medium text-fg transition-colors hover:bg-white/15"
                >
                  ← Volver a Academy
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