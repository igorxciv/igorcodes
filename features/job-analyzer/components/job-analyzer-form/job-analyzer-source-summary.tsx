"use client";

import { jobAnalyzerOptions } from "@/features/job-analyzer/constants/job-analyzer-options";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerSourceSummaryProps = HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerSourceSummary({
  className,
  ...restProps
}: JobAnalyzerSourceSummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
        className,
      )}
      {...restProps}
    >
      {jobAnalyzerOptions.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-500">
            {option.label}
          </span>
          <span>{option.description}</span>
        </div>
      ))}
    </div>
  );
}
