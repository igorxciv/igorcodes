import { Terminal } from "lucide-react";

import {
  SectionDescription,
  SectionEyebrow,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type AboutHeroProps = HTMLAttributes<HTMLElement>;

export function AboutHero({ className, ...restProps }: AboutHeroProps) {
  return (
    <section className={cn("flex flex-col gap-10", className)} {...restProps}>
      <div className="flex flex-col gap-5">
        <SectionEyebrow>
          <Terminal aria-hidden="true" className="size-3 text-emerald-300" />
          <span>$ cat about.md</span>
        </SectionEyebrow>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            About Me
          </h1>
          <SectionDescription className="max-w-2xl text-base sm:text-lg">
            A full-stack engineer since 2014, shaped by curiosity and a passion
            for building products that deliver real impact.
          </SectionDescription>
        </div>
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100/70 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]" />
          <div className="relative aspect-[4/5] w-full">
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold tracking-[0.3em] text-zinc-400 uppercase">
              Portrait Placeholder
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Hi, I&apos;m Igor
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
            I started in 2014 after my first manager challenged me to dive into
            frontend engineering. That spark turned into a full-stack career
            spanning Fortune 500 clients, large product companies, and startups
            across diverse business domains and tech stacks.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
            I&apos;ve led distributed teams with a focus on innovation,
            performance, and delivery. Today I&apos;m at{" "}
            <a
              className="underline-offset-4 transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-300"
              href="https://electives.io"
              rel="noreferrer"
              target="_blank"
            >
              Electives
            </a>
            , helping build a next-gen live learning platform.
          </p>
        </div>
      </div>
    </section>
  );
}
