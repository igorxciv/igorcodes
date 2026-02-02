import { Sparkles } from "lucide-react";

import { cn } from "@/lib/styles/cn";

import { SectionEyebrow } from "./section-header";

import type { HTMLAttributes } from "react";

type CatNoteSectionProps = HTMLAttributes<HTMLElement>;

export function CatNoteSection({
  className,
  ...restProps
}: CatNoteSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 dark:border-white/10 dark:from-white/5 dark:via-transparent dark:to-white/5",
        className,
      )}
      {...restProps}
    >
      <div className="flex flex-col gap-4">
        <SectionEyebrow>
          <Sparkles aria-hidden="true" className="size-3 text-emerald-300" />
          <span>./digital-cats</span>
        </SectionEyebrow>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Why cats are everywhere here
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300">
          I&apos;m allergic to cats but love them dearly. This website is my way
          of &quot;owning a cat&quot; digitally--a pragmatic yet creative
          solution to a limitation. It&apos;s how I approach most challenges:
          find the constraints, then build something meaningful within them.
        </p>
      </div>
    </section>
  );
}
