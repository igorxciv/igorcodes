import { cn } from "@/lib/styles/cn";

import {
  FeatureCard,
  FeatureCardDescription,
  FeatureCardMedia,
  FeatureCardTitle,
} from "./feature-card";
import { FeatureGrid } from "./feature-grid";
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "./section-header";

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
          <span className="text-emerald-300">&lt;/&gt;</span> ./what-i-do
        </SectionEyebrow>
        <SectionTitle>Building with purpose</SectionTitle>
        <SectionDescription>
          I approach problems with systems thinking, caring deeply about
          structure, aesthetics, and creating solutions that compound over time.
        </SectionDescription>
      </SectionHeader>
      <FeatureGrid>
        <FeatureCard>
          <FeatureCardMedia className="bg-[linear-gradient(135deg,_rgba(56,189,248,0.18),_rgba(15,23,42,0.6))]" />
          <FeatureCardTitle>Product Engineering</FeatureCardTitle>
          <FeatureCardDescription>
            Building full-stack applications that solve real problems. From
            architecture to implementation, I focus on creating intuitive
            experiences backed by robust systems.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <FeatureCardMedia className="bg-[linear-gradient(135deg,_rgba(96,165,250,0.18),_rgba(30,41,59,0.65))]" />
          <FeatureCardTitle>AI Infrastructure</FeatureCardTitle>
          <FeatureCardDescription>
            Designing and implementing AI-powered features at scale. Passionate
            about making complex technology accessible and useful for real
            users.
          </FeatureCardDescription>
        </FeatureCard>
      </FeatureGrid>
    </section>
  );
}
