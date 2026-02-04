"use client";

import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerDropzoneRootProps = {
  isDragActive: boolean;
  isDragReject: boolean;
} & HTMLAttributes<HTMLLabelElement>;

export function JobAnalyzerDropzoneRoot({
  isDragActive,
  isDragReject,
  className,
  children,
  ...restProps
}: JobAnalyzerDropzoneRootProps) {
  return (
    <label
      className={cn(
        "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border px-4 py-6 text-center text-sm transition",
        isDragReject
          ? "border-2 border-dotted border-rose-400/70 bg-rose-500/10 text-rose-700 dark:border-rose-400/70 dark:bg-rose-500/10 dark:text-rose-200"
          : isDragActive
            ? "border-2 border-dotted border-emerald-400/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-500/10 dark:text-emerald-100"
            : "border-dotted border-zinc-200/80 bg-white/70 text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300",
        className,
      )}
      aria-invalid={isDragReject}
      {...restProps}
    >
      {children}
    </label>
  );
}
