import { GitBranch, Heart, Zap } from "lucide-react";

import {
  FeatureCard,
  FeatureCardDescription,
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

type AboutValuesProps = HTMLAttributes<HTMLElement>;

export function AboutValues({ className, ...restProps }: AboutValuesProps) {
  return (
    <section className={cn("flex flex-col gap-10", className)} {...restProps}>
      <SectionHeader>
        <SectionEyebrow>
          <GitBranch aria-hidden="true" className="size-3 text-emerald-300" />
          <span>./values</span>
        </SectionEyebrow>
        <SectionTitle>What drives me</SectionTitle>
        <SectionDescription>
          Principles that shape how I build, collaborate, and create.
        </SectionDescription>
      </SectionHeader>
      <FeatureGrid className="md:grid-cols-3">
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Zap className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>High Agency</FeatureCardTitle>
          <FeatureCardDescription>
            I believe in taking ownership and making things happen. When I see a
            problem, I build the solution rather than wait for someone else to
            do it.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <GitBranch className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>Systems Thinking</FeatureCardTitle>
          <FeatureCardDescription>
            I look beyond immediate solutions to understand how pieces fit
            together. Every decision is made with the bigger picture in mind.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Heart className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>Long-term Leverage</FeatureCardTitle>
          <FeatureCardDescription>
            I focus on building things that compound over time—systems,
            infrastructure, and tools that create value long after they&apos;re
            built.
          </FeatureCardDescription>
        </FeatureCard>
      </FeatureGrid>
      <FeatureCard className="border-zinc-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5">
        <FeatureCardTitle className="text-xl sm:text-2xl">
          Pragmatic yet creative
        </FeatureCardTitle>
        <FeatureCardDescription className="text-sm leading-relaxed sm:text-base">
          I approach challenges with a pragmatic mindset but always leave room
          for creativity. Structure and aesthetics aren&apos;t opposing
          forces—they work together to create experiences that are both
          functional and delightful.
          <br />
          <br />
          You&apos;ll find this philosophy reflected throughout this website.
          From the terminal-inspired design to the pixel art cat companion (my
          digital pet since I&apos;m allergic to real cats), every element is
          intentional and meaningful.
        </FeatureCardDescription>
      </FeatureCard>
    </section>
  );
}
