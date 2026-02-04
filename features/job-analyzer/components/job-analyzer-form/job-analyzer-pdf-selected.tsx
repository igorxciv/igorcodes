"use client";

import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerPdfSelectedProps = {
  fileName: string;
  onRemove: () => void;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerPdfSelected({
  fileName,
  onRemove,
  className,
  ...restProps
}: JobAnalyzerPdfSelectedProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100",
        className,
      )}
      {...restProps}
    >
      <span className="truncate">{fileName}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-3 text-[10px] font-semibold tracking-[0.2em] text-emerald-200 uppercase transition hover:text-emerald-100"
      >
        Remove
      </button>
    </div>
  );
}
