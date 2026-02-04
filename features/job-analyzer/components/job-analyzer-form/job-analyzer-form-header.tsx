"use client";

import { Sparkles } from "lucide-react";

import type { HTMLAttributes } from "react";

type JobAnalyzerFormHeaderProps = HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerFormHeader({
  className,
  ...restProps
}: JobAnalyzerFormHeaderProps) {
  return (
    <div className={className} {...restProps}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          <Sparkles aria-hidden="true" className="size-4 text-emerald-400" />
          job_analyzer.ai
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Analyze job postings to see how candidates fit the role, values, and
          culture.
        </p>
      </div>
    </div>
  );
}
