import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  MessageCircle,
  ArrowLeft,
  Tag,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { getProductByIdAction } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/current-user";
import { BuyButton } from "@/components/shop/buy-button";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductoDetailPage({ params }: Props) {
  const { id } = await params;

  const [user, product] = await Promise.all([
    getCurrentUser(),
    getProductByIdAction(id),
  ]);

  if (!product) notFound();

  const isSocioActivo = user?.membership?.status === "active";

  const pvp = parseFloat(product.precioPublico);
  const socio = parseFloat(product.precioSocio);
  const ahorro = pvp - socio;
  const ahorroPercent = Math.round((ahorro / pvp) * 100);

  const waText = encodeURIComponent(`Hola, me interesa el producto: ${product.nombre}`);
  const waHref = `https://wa.me/34600000000?text=${waText}`;

  const subcatParts = product.subcategoria?.split("/") ?? [];
  const categoriaLabel = product.categoria ? slugToLabel(product.categoria) : "Shop";
  const subcat1 = subcatParts[0] ? slugToLabel(subcatParts[0]) : null;
  const subcat2 = subcatParts[1] ? slugToLabel(subcatParts[1]) : null;

  const backHref = product.categoria && subcatParts.length === 2
    ? `/categoria-producto/${product.categoria}/${subcatParts[0]}/${subcatParts[1]}`
    : "/shop";

  const n1 = parseFloat(product.porcentajeN1);
  const totalCommission = [
    product.porcentajeN1,
    product.porcentajeN2,
    product.porcentajeN3,
    product.porcentajeN4,
    product.porcentajeN5,
  ].reduce((acc, v) => acc + parseFloat(v), 0);

  return (
    <div className="dark min-h-screen bg-black text-fg antialiased">
      <MarketingNav />

      <div className="pt-14">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-6 py-5">
          <nav className="flex items-center gap-2 text-xs text-muted flex-wrap">
            <Link href="/" className="transition-colors hover:text-fg">Inicio</Link>
            <span>/</span>
            <Link href="/shop" className="transition-colors hover:text-fg">Shop</Link>
            {product.categoria && (
              <>
                <span>/</span>
                <Link
                  href={`/categoria-producto/${product.categoria}`}
                  className="transition-colors hover:text-fg"
                >
                  {categoriaLabel}
                </Link>
              </>
            )}
            {subcat1 && product.categoria && (
              <>
                <span>/</span>
                <Link
                  href={`/categoria-producto/${product.categoria}/${subcatParts[0]}`}
                  className="transition-colors hover:text-fg"
                >
                  {subcat1}
                </Link>
              </>
            )}
            {subcat2 && product.categoria && subcatParts[0] && (
              <>
                <span>/</span>
                <Link
                  href={backHref}
                  className="transition-colors hover:text-fg"
                >
                  {subcat2}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-fg truncate max-w-[160px]">{product.nombre}</span>
          </nav>
        </div>

        {/* Main grid */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

            {/* LEFT — Image */}
            <div className="relative">
              <Link
                href={backHref}
                className="mb-6 inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-fg"
              >
                <ArrowLeft size={13} />
                Volver al catálogo
              </Link>

              <div
                className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/[0.07] bg-card"
                style={{ boxShadow: "rgba(0,153,255,0.06) 0px 0px 80px 0px" }}
              >
                {product.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-faint">
                    <ShoppingCart size={64} strokeWidth={1} />
                    {product.marca && (
                      <span className="text-sm uppercase tracking-widest text-muted">
                        {product.marca}
                      </span>
                    )}
                  </div>
                )}

                {/* Badges */}
                {isSocioActivo && (
                  <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-black">
                    Precio socio
                  </span>
                )}
                {ahorroPercent > 0 && isSocioActivo && (
                  <span className="absolute left-4 top-4 rounded-full bg-green-500 px-3 py-1.5 text-[11px] font-semibold text-black">
                    -{ahorroPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT — Info */}
            <div className="flex flex-col gap-6 lg:pt-10">
              {/* Brand + Category */}
              <div className="flex flex-wrap items-center gap-2">
                {product.marca && (
                  <span className="rounded-full border border-accent/30 bg-accent/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    {product.marca}
                  </span>
                )}
                {subcat2 && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-muted">
                    {subcat2}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-bold text-fg"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                }}
              >
                {product.nombre}
              </h1>

              {/* Description */}
              {product.descripcion && (
                <p className="text-base leading-relaxed text-muted">
                  {product.descripcion}
                </p>
              )}

              {/* Pricing block */}
              <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                {isSocioActivo ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-4">
                      <span
                        className="font-bold text-fg"
                        style={{ fontSize: "clamp(32px, 5vw, 44px)", letterSpacing: "-0.04em" }}
                      >
                        {fmt.format(socio)}
                      </span>
                      <span className="text-lg text-muted line-through">{fmt.format(pvp)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-green-400" />
                      <p className="text-sm text-green-400 font-medium">
                        Ahorras {fmt.format(ahorro)} — {ahorroPercent}% descuento exclusivo socio
                      </p>
                    </div>
                    <p className="text-xs text-muted">IVA incluido · Precio exclusivo para socios activos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span
                      className="font-bold text-fg"
                      style={{ fontSize: "clamp(32px, 5vw, 44px)", letterSpacing: "-0.04em" }}
                    >
                      {fmt.format(pvp)}
                    </span>
                    <p className="text-sm text-muted">IVA incluido · Precio público</p>
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3">
                      <Tag size={13} className="text-accent shrink-0" />
                      <p className="text-xs text-muted">
                        <Link
                          href="/register"
                          className="font-semibold text-fg hover:text-accent transition-colors"
                        >
                          Hazte socio
                        </Link>{" "}
                        y consigue este producto por{" "}
                        <span className="font-semibold text-accent">{fmt.format(socio)}</span>
                        {" "}(ahorra {fmt.format(ahorro)})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Commission info — only for active members */}
              {isSocioActivo && (
                <div className="rounded-2xl border border-white/[0.07] bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                      Distribución de comisiones
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { level: "N1", pct: product.porcentajeN1 },
                      { level: "N2", pct: product.porcentajeN2 },
                      { level: "N3", pct: product.porcentajeN3 },
                      { level: "N4", pct: product.porcentajeN4 },
                      { level: "N5", pct: product.porcentajeN5 },
                    ].map(({ level, pct }) => {
                      const euros = (socio * parseFloat(pct)) / 100;
                      return (
                        <div
                          key={level}
                          className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-subtle p-2.5"
                        >
                          <span className="text-[10px] font-medium text-muted">{level}</span>
                          <span className="text-sm font-bold text-fg">{parseFloat(pct)}%</span>
                          <span className="text-[10px] text-accent">{fmt.format(euros)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <Users size={11} className="text-muted" />
                      <span className="text-xs text-muted">Total distribuido a la red</span>
                    </div>
                    <span className="text-xs font-semibold text-fg">
                      {totalCommission.toFixed(1)}% — {fmt.format((socio * totalCommission) / 100)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {isSocioActivo ? (
                  <BuyButton productId={product.id} productName={product.nombre} />
                ) : (
                  <Link
                    href="/register"
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    <Shield size={16} />
                    Hazte socio para comprar
                  </Link>
                )}

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-fg"
                >
                  <MessageCircle size={15} />
                  Consultar por WhatsApp
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { icon: Shield, label: "Compra segura", sub: "Procesado via wallet" },
                  { icon: TrendingUp, label: "Comisiones en red", sub: "5 niveles automático" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-subtle p-3"
                  >
                    <Icon size={15} className="mt-0.5 shrink-0 text-accent" />
                    <div>
                      <p className="text-xs font-semibold text-fg">{label}</p>
                      <p className="text-[11px] text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}