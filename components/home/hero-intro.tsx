import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import { SectionEyebrow } from "./section-header";

import type { HTMLAttributes } from "react";

type HeroIntroProps = HTMLAttributes<HTMLDivElement>;

export function HeroIntro({ className, ...restProps }: HeroIntroProps) {
  return (
    <div className={cn("flex flex-col gap-7", className)} {...restProps}>
      <SectionEyebrow>
        <span className="text-emerald-300">&gt;_</span> $ whoami
      </SectionEyebrow>
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl">
          Systems thinker building tools that create long-term leverage
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          High-agency builder who transforms complex problems into elegant
          solutions. Focused on architecture, AI infrastructure, and products
          that scale.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button className="hover:translate-y-[-1px]">
          View Projects
          <span aria-hidden="true">-&gt;</span>
        </Button>
        <Button variant="outline">Resume</Button>
      </div>
    </div>
  );
}
