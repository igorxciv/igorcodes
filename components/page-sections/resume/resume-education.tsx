import { GraduationCap } from "lucide-react";

import {
  FeatureCard,
  FeatureCardDescription,
  FeatureCardTitle,
} from "@/components/page-sections/shared/feature-card";
import {
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ResumeEducationProps = HTMLAttributes<HTMLElement>;

export function ResumeEducation({
  className,
  ...restProps
}: ResumeEducationProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)} {...restProps}>
      <div className="flex flex-col gap-3">
        <SectionEyebrow>
          <GraduationCap
            aria-hidden="true"
            className="size-3 text-emerald-300"
          />
          <span>./education</span>
        </SectionEyebrow>
        <SectionTitle className="text-2xl sm:text-3xl">Education</SectionTitle>
      </div>
      <FeatureCard className="border-white/10 bg-white/5">
        <FeatureCardTitle>
          Bachelor of Science in Computer Science
        </FeatureCardTitle>
        <FeatureCardDescription className="text-sm text-zinc-400">
          University · 2014 - 2018
        </FeatureCardDescription>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Focus on algorithms, data structures, and software engineering
          principles.
        </p>
      </FeatureCard>
    </section>
  );
}
