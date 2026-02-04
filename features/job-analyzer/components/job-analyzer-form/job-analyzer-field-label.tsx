"use client";

import { cn } from "@/lib/styles/cn";

import type { LabelHTMLAttributes } from "react";

type JobAnalyzerFieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function JobAnalyzerFieldLabel({
  className,
  ...restProps
}: JobAnalyzerFieldLabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400",
        className,
      )}
      {...restProps}
    />
  );
}
