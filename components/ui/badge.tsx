import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "error" | "neutral";

const variants: Record<Variant, string> = {
  success:
    "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 dark:border-green-400/20",
  warning:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-400/20",
  error:
    "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 dark:border-red-400/20",
  neutral:
    "bg-subtle text-muted border-border",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
