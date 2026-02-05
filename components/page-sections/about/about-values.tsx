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
          Principles that shape how I build, lead, and collaborate.
        </SectionDescription>
      </SectionHeader>
      <FeatureGrid className="md:grid-cols-3">
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Zap className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>Curiosity First</FeatureCardTitle>
          <FeatureCardDescription>
            A challenge to learn frontend in 2014 became a career-long habit of
            exploring new tech and turning it into real-world outcomes.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <GitBranch className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>Full-Stack Perspective</FeatureCardTitle>
          <FeatureCardDescription>
            I connect frontend, backend, and infrastructure choices to make
            systems reliable, scalable, and easier for teams to evolve.
          </FeatureCardDescription>
        </FeatureCard>
        <FeatureCard>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Heart className="size-5" aria-hidden="true" />
          </div>
          <FeatureCardTitle>Lead With Impact</FeatureCardTitle>
          <FeatureCardDescription>
            I&apos;ve led distributed teams across domains, aligning engineering
            with product goals and shipping reliably.
          </FeatureCardDescription>
        </FeatureCard>
      </FeatureGrid>
      <FeatureCard className="border-zinc-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5">
        <FeatureCardTitle className="text-xl sm:text-2xl">
          Product-minded builder
        </FeatureCardTitle>
        <FeatureCardDescription className="text-sm leading-relaxed sm:text-base">
          I enjoy building software that balances craft with business outcomes.
          From Fortune 500 engagements to high-growth startups, I focus on
          performance, accessibility, and developer experience to create
          products that last.
          <br />
          <br />
          Today, I&apos;m focused on live learning at{" "}
          <a
            className="underline-offset-4 transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-300"
            href="https://electives.io"
            rel="noreferrer"
            target="_blank"
          >
            Electives
          </a>
          , shaping a platform that helps people learn together in real time.
        </FeatureCardDescription>
      </FeatureCard>
    </section>
  );
}
