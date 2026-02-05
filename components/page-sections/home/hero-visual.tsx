import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type HeroVisualProps = HTMLAttributes<HTMLDivElement>;

export function HeroVisual({ className, ...restProps }: HeroVisualProps) {
  return (
    <div className={cn("relative", className)} {...restProps}>
      <div className="absolute -inset-4 rounded-[32px] bg-linear-to-br from-zinc-100 via-white to-transparent blur-2xl dark:from-white/10 dark:via-white/5" />
      <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-linear-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
        <div className="aspect-video w-full rounded-2xl border border-zinc-200 bg-[linear-gradient(135deg,rgba(0,0,0,0.04),rgba(0,0,0,0.01))] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]">
          <div className="flex h-full w-full flex-col justify-between rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/40">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Shipping thoughtful systems
            </div>
            <div className="grid gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>
                const northStar = &quot;clarity, craft, momentum&quot;
              </span>
              <span>export default buildWithIntent;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
