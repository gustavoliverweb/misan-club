import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer
      className="px-6 py-10"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <span className="text-sm font-semibold tracking-tight text-fg">
          MisanClub
        </span>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} MisanClub. Todos los derechos reservados.
        </p>
        <nav className="flex items-center gap-6">
          {[
            { label: "Términos", href: "/terminos" },
            { label: "Privacidad", href: "/privacidad" },
            { label: "Contacto", href: "/contacto" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-muted transition-colors hover:text-fg"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}