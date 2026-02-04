"use client";

import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerFormShellProps = HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerFormShell({
  className,
  children,
  ...restProps
}: JobAnalyzerFormShellProps) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-zinc-950/70",
        className,
      )}
      {...restProps}
    >
      {children}
    </div>
  );
}
