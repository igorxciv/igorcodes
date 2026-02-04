"use client";

import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerFieldHintProps = HTMLAttributes<HTMLParagraphElement>;

export function JobAnalyzerFieldHint({
  className,
  ...restProps
}: JobAnalyzerFieldHintProps) {
  return (
    <p
      className={cn("text-xs text-zinc-600 dark:text-zinc-400", className)}
      {...restProps}
    />
  );
}
