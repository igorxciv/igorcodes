import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type HeroVisualProps = HTMLAttributes<HTMLDivElement>;

export function HeroVisual({ className, ...restProps }: HeroVisualProps) {
  return (
    <div className={cn("relative", className)} {...restProps}>
      <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6">
        <div className="aspect-[16/9] w-full rounded-2xl border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.02))] p-4">
          <div className="flex h-full w-full flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Placeholder image
            </div>
            <div className="grid gap-2 text-[11px] text-zinc-400">
              <span>export default future;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
