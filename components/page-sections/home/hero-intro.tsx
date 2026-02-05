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
          Building thoughtful software with a human heartbeat
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300">
          I turn complex ideas into calm, reliable products. Today I&apos;m
          building a next-gen live learning platform at{" "}
          <a
            className="underline-offset-4 transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-300"
            href="https://electives.io"
            rel="noreferrer"
            target="_blank"
          >
            Electives
          </a>
          . When I&apos;m not shipping, I&apos;m exploring new tools, refining
          craft, and collaborating with teams that care about quality.
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
