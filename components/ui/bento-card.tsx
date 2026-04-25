import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Static informative card — no pointer effects ── */
export function BentoCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card p-6",
        "shadow-[rgba(0,0,0,0.07)_0px_0px_0px_1px] dark:shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Clickable card — hover glow + lift ─────────── */
interface BentoCardLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function BentoCardLink({ href, className, children }: BentoCardLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-card p-6",
        "transition-all duration-300 ease-out",
        "shadow-[rgba(0,0,0,0.07)_0px_0px_0px_1px] dark:shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px]",
        "hover:-translate-y-0.5",
        "hover:shadow-[rgba(0,0,0,0.12)_0px_0px_0px_1px,_0px_8px_32px_-4px_rgba(37,99,235,0.12)]",
        "dark:hover:shadow-[rgba(0,153,255,0.3)_0px_0px_0px_1px,_0px_8px_32px_-4px_rgba(0,153,255,0.12)]",
        className,
      )}
    >
      {/* accent corner gradient, reveals on hover */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full",
          "bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)]",
          "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        )}
      />
      {children}
    </Link>
  );
}
