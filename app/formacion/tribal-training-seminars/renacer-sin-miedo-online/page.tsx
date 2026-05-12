import Link from "next/link";
import { ArrowRight, Laptop, Clock, Calendar, Users } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const objetivos = [
  "Romper bloqueos internos y reconectar con tu misión personal",
  "Ejercicios de impacto adaptados al formato online",
  "Dinámicas guiadas para transformar patrones limitantes",
  "Momentos colectivos con la tribu en tiempo real",
  "Plan de acción personal para los próximos 90 días",
];

export default function RenacerOnlinePage() {
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
            <Link href="/formacion/tribal-training-seminars" className="transition-colors hover:text-fg">
              Tribal Training
            </Link>
            <span>/</span>
            <span className="text-fg">Renacer Sin Miedo · Online</span>
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
                Seminar intensivo · Online en vivo
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
              Renacer Sin Miedo
              <br />
              <span className="text-muted">Online</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              La misma experiencia transformadora de fin de semana en formato
              digital. Conecta con la tribu en directo y rompe los bloqueos que
              te impiden avanzar, desde cualquier lugar del mundo.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Dinámico", "Grupal", "Digital", "En directo"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Format + Content */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">

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
                    { Icon: Laptop, label: "Modalidad", value: "Online en vivo" },
                    { Icon: Calendar, label: "Días", value: "Sábado y Domingo" },
                    { Icon: Clock, label: "Duración", value: "2 días intensivos" },
                    { Icon: Users, label: "Estilo", value: "Grupal en directo" },
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
                <div
                  className="mt-7 rounded-xl p-4"
                  style={{ background: "rgba(0,153,255,0.05)", border: "1px solid rgba(0,153,255,0.1)" }}
                >
                  <p className="text-xs leading-relaxed text-muted">
                    Misma intensidad que el presencial, adaptada
                    al entorno digital con ejercicios guiados en vivo.
                  </p>
                </div>
              </div>

              <div
                className="md:col-span-3 rounded-2xl border border-white/[0.06] bg-card p-7"
                style={{ boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px" }}
              >
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Qué vivirás
                </p>
                <ul className="space-y-3">
                  {objetivos.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-accent/60" />
                      <span className="text-sm leading-relaxed text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
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
                Renace desde
                <br />
                donde estés.
              </h2>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Activar membresía
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/formacion/tribal-training-seminars"
                  className="inline-flex h-11 items-center rounded-full bg-white/10 px-7 text-sm font-medium text-fg transition-colors hover:bg-white/15"
                >
                  ← Volver a Tribal Training
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