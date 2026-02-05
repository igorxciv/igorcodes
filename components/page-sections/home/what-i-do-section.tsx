import { Code2 } from "lucide-react";

import {
  FeatureCard,
  FeatureCardDescription,
  FeatureCardMedia,
  FeatureCardTitle,
} from "@/components/page-sections/shared/feature-card";
import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type WhatIDoSectionProps = HTMLAttributes<HTMLElement>;

export function WhatIDoSection({
  className,
  ...restProps
}: WhatIDoSectionProps) {
  return (
    <section className={cn("flex flex-col gap-10", className)} {...restProps}>
      <SectionHeader>
        <SectionEyebrow>
          <Code2 aria-hidden="true" className="size-3 text-emerald-300" />
          <span>./what-i-do</span>
        </SectionEyebrow>
        <SectionTitle>How I work</SectionTitle>
        <SectionDescription>
          I care about clarity, momentum, and making complex systems feel simple
          for real people.
        </SectionDescription>
      </SectionHeader>
      <FeatureGrid>
        <FeatureCard>
          <FeatureCardMedia className="bg-[linear-gradient(135deg,_rgba(56,189,248,0.18),_rgba(15,23,42,0.6))]" />
          <FeatureCardTitle>Build With Intent</FeatureCardTitle>
          <FeatureCardDescription>
            From first sketch to production, I aim for software that feels calm,
            fast, and dependable. The goal is always outcomes—not just output.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <FeatureCardMedia className="bg-[linear-gradient(135deg,_rgba(96,165,250,0.18),_rgba(30,41,59,0.65))]" />
          <FeatureCardTitle>Explore New Frontiers</FeatureCardTitle>
          <FeatureCardDescription>
            I&apos;m currently obsessed with AI agents, realtime experiences,
            and workflows that make teams more effective.
          </FeatureCardDescription>
        </FeatureCard>
      </FeatureGrid>
    </section>
  );
}
