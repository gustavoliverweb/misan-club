import Link from "next/link";
import { ArrowRight, Clock, Sun, Zap, ArrowLeft } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const contenidos = [
  "Perdón y liberación emocional de cargas del pasado",
  "Programación mental para instalar patrones de éxito",
  "Técnicas de foco y prioridades para multiplicar resultados",
  "Productividad consciente — hacer más con menos ruido",
  "Liderazgo transformacional para influir desde el propósito",
];

export default function DelSofaParte2Page() {
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
            <span className="text-fg">Del sofá al éxito · Parte 2</span>
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
                45 días · Renace en 90 días — Parte 2
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
              Del sofá al éxito
              <br />
              <span className="text-muted">Parte 2</span>
            </h1>

            <p className="mt-4 text-sm font-medium text-accent" style={{ letterSpacing: "-0.01em" }}>
              Rompe tus barreras: profundiza, lidera y expande.
            </p>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Segunda mitad del sistema de 90 días. Los 45 días finales para
              liberar el pasado, reprogramar tu mente y convertirte en el
              líder que tu vida necesita.
            </p>
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
                    { Icon: Clock, label: "Duración", value: "45 días" },
                    { Icon: Sun, label: "Ritmo", value: "Trabajo diario" },
                    { Icon: Zap, label: "Enfoque", value: "Liderazgo y expansión" },
                    { Icon: ArrowLeft, label: "Requiere", value: "Del sofá al éxito — P1" },
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

                {/* Progress bar */}
                <div className="mt-7 border-t border-white/[0.06] pt-6">
                  <div className="flex justify-between text-[11px] text-muted mb-2">
                    <span>Progreso del sistema</span>
                    <span>2 / 2</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: "100%", background: "rgba(0,153,255,0.6)" }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-muted">90 de 90 días — completo</p>
                </div>
              </div>

              <div
                className="md:col-span-3 rounded-2xl border border-white/[0.06] bg-card p-7"
                style={{ boxShadow: "rgba(0,0,0,0.4) 0px 20px 48px -8px" }}
              >
                <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-accent">
                  Contenidos
                </p>
                <ul className="space-y-3">
                  {contenidos.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-accent/60" />
                      <span className="text-sm leading-relaxed text-muted">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between rounded-xl border border-white/[0.06] bg-subtle px-5 py-4">
                  <div>
                    <p className="text-xs text-muted">Empieza por</p>
                    <p className="mt-0.5 text-sm font-medium text-fg">Del sofá al éxito — Parte 1</p>
                  </div>
                  <Link
                    href="/formacion/tribal-training-seminars/del-sofa-al-exito-parte-1"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-4 py-2 text-xs text-muted transition-colors hover:text-fg"
                  >
                    Ver <ArrowRight size={11} />
                  </Link>
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
                90 días para
                <br />
                liderar tu vida.
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