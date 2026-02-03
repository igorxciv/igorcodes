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
            A builder at heart, driven by curiosity and the desire to create
            tools that make a lasting impact.
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
            Hi, I&apos;m [Your Name]
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
            I&apos;m a systems-thinking builder who believes in creating
            leverage through thoughtful engineering. My work spans product
            development, AI infrastructure, and architecture—always with an eye
            toward long-term impact.
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
            I care deeply about structure, aesthetics, and building products
            that feel both powerful and intuitive. Whether it&apos;s optimizing
            infrastructure or crafting user experiences, I approach every
            problem as an opportunity to create something meaningful.
          </p>
        </div>
      </div>
    </section>
  );
}
