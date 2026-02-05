import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes, ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "success" | "note";

type MdxCalloutProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  variant?: CalloutVariant;
  icon?: ReactNode;
};

const variantStyles: Record<CalloutVariant, string> = {
  info: "border-sky-200/80 bg-sky-50/80 text-sky-950 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100",
  warning:
    "border-amber-200/80 bg-amber-50/80 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100",
  success:
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  note: "border-zinc-200/80 bg-white/80 text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100",
};

export function MdxCallout({
  title,
  variant = "note",
  icon,
  className,
  children,
  ...restProps
}: MdxCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 text-sm leading-6 shadow-sm",
        variantStyles[variant],
        className,
      )}
      {...restProps}
    >
      {(title || icon) && (
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
          {icon}
          {title}
        </div>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}
