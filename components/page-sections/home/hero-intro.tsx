import { ArrowUpRight, Terminal } from "lucide-react";

import { SectionEyebrow } from "@/components/page-sections/shared/section-header";
import { MicroInteractionButton } from "@/components/ui/micro-interaction-button";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type HeroIntroProps = HTMLAttributes<HTMLDivElement>;

export function HeroIntro({ className, ...restProps }: HeroIntroProps) {
  return (
    <div className={cn("flex flex-col gap-7", className)} {...restProps}>
      <SectionEyebrow>
        <Terminal aria-hidden="true" className="size-3 text-emerald-300" />
        <span>$ whoami</span>
      </SectionEyebrow>
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          Systems thinker building tools that create long-term leverage
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300">
          High-agency builder who transforms complex problems into elegant
          solutions. Focused on architecture, AI infrastructure, and products
          that scale.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <MicroInteractionButton>
          View Projects
          <ArrowUpRight aria-hidden="true" />
        </MicroInteractionButton>
        <MicroInteractionButton variant="outline">
          Resume
        </MicroInteractionButton>
      </div>
    </div>
  );
}
