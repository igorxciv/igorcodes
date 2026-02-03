import { Terminal } from "lucide-react";

import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ProjectsHeroProps = HTMLAttributes<HTMLElement>;

export function ProjectsHero({ className, ...restProps }: ProjectsHeroProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)} {...restProps}>
      <SectionEyebrow>
        <Terminal aria-hidden="true" className="size-3 text-emerald-300" />
        <span>$ ls projects/</span>
      </SectionEyebrow>
      <SectionTitle className="text-3xl sm:text-4xl">Projects</SectionTitle>
      <SectionDescription className="max-w-2xl text-base sm:text-lg">
        A collection of tools, platforms, and systems I&apos;ve built. Each
        project represents a step toward creating more leverage and solving real
        problems at scale.
      </SectionDescription>
    </section>
  );
}
