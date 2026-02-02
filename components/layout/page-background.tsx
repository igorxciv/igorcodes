import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type PageBackgroundProps = HTMLAttributes<HTMLDivElement>;

export function PageBackground({
  className,
  ...restProps
}: PageBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      {...restProps}
    >
      <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-400/10 to-transparent blur-3xl" />
      <div className="absolute right-[-10%] bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-white/10 via-blue-500/10 to-transparent blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
    </div>
  );
}
