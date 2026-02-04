"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import type { ButtonHTMLAttributes } from "react";

type JobAnalyzerSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function JobAnalyzerSubmitButton({
  className,
  ...restProps
}: JobAnalyzerSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="outline"
      className={cn(
        "h-12 w-full border-emerald-400/70 text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase shadow-[0_0_0_1px_rgba(16,185,129,0.1)] transition hover:border-emerald-500 hover:text-emerald-800 dark:border-emerald-400/70 dark:text-emerald-200 dark:hover:text-emerald-100",
        className,
      )}
      {...restProps}
    >
      analyze_job()
    </Button>
  );
}
