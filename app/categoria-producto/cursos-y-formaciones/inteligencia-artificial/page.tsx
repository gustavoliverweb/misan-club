import Link from "next/link";
import { ArrowRight, Bot, Cpu, BarChart2, Megaphone } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

const services = [
  {
    Icon: BarChart2,
    title: "Consultoría estratégica",
    description:
      "Análisis de tu negocio y diseño de una hoja de ruta para integrar la IA de forma rentable y sostenible.",
  },
  {
    Icon: Cpu,
    title: "Automatización de procesos",
    description:
      "Identificación y automatización de tareas repetitivas para liberar tiempo y reducir errores operativos.",
  },
  {
    Icon: Bot,
    title: "Desarrollo de chatbots",
    description:
      "Chatbots personalizados para atención al cliente, captación de leads y soporte interno 24/7.",
  },
  {
    Icon: Megaphone,
    title: "Marketing de contenidos con IA",
    description:
      "Estrategias y herramientas para crear, publicar y distribuir contenido de alto impacto a escala.",
  },
];

const products = [
  {
    label: "Agentes de IA específicos",
    description: "Agentes entrenados para casos de uso concretos de tu negocio.",
  },
  {
    label: "Formaciones intensivas",
    description: "Talleres prácticos para dominar las herramientas de IA más potentes del mercado.",
  },
];

export default function InteligenciaArtificialPage() {
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
            <span className="text-fg">Inteligencia Artificial</span>
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
                Tecnología aplicada · Consultoría + Formación
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
              Inteligencia
              <br />
              Artificial
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Consultoría estratégica y formaciones intensivas para integrar la
              IA en tu negocio. Automatización, chatbots, agentes y marketing
              de contenidos potenciado por tecnología de vanguardia.
            </p>

            {/* Consultor */}
            <div
              className="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-card px-5 py-4"
              style={{ boxShadow: "rgba(0,0,0,0.3) 0px 8px 24px -4px" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                JP
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">Julián Parra</p>
                <p className="mt-0.5 text-xs text-muted">
                  Consultor IA · 30 años de experiencia
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Servicios
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {services.map(({ Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.06] bg-card p-6"
                  style={{ boxShadow: "rgba(0,0,0,0.35) 0px 16px 40px -8px" }}
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-black">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <h3
                    className="mb-2 text-base font-bold text-fg"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.15em] text-accent">
              Productos
            </p>
            <div className="space-y-4">
              {products.map(({ label, description }) => (
                <div
                  key={label}
                  className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-card px-6 py-5"
                  style={{ boxShadow: "rgba(0,0,0,0.3) 0px 12px 32px -6px" }}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-semibold text-fg">{label}</p>
                    <p className="mt-1 text-sm text-muted">{description}</p>
                  </div>
                </div>
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
              <h2
                className="mx-auto max-w-sm font-bold text-fg"
                style={{
                  fontSize: "clamp(28px, 4vw, 42px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                Lleva la IA
                <br />
                a tu negocio.
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
                Activa tu membresía en MisanClub y accede a la formación y
                consultoría en inteligencia artificial.
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
                  href="/formacion"
                  className="inline-flex h-11 items-center rounded-full bg-white/10 px-7 text-sm font-medium text-fg transition-colors hover:bg-white/15"
                >
                  ← Ver toda la formación
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