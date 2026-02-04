"use client";

import { CircleX, Upload } from "lucide-react";

import type { HTMLAttributes } from "react";

type JobAnalyzerDropzoneStatusProps = {
  isDragReject: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerDropzoneStatus({
  isDragReject,
  className,
  ...restProps
}: JobAnalyzerDropzoneStatusProps) {
  return (
    <div className={className} {...restProps}>
      <div className="flex flex-col items-center gap-2">
        {isDragReject ? (
          <CircleX aria-hidden="true" className="size-5 text-rose-300" />
        ) : (
          <Upload aria-hidden="true" className="size-5" />
        )}
        <div className="text-sm font-semibold text-zinc-800 uppercase dark:text-zinc-100">
          {isDragReject ? "File not allowed" : "Drop a PDF here"}
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          {isDragReject
            ? "Only .pdf files are supported"
            : "or click to browse (PDF only)"}
        </div>
      </div>
    </div>
  );
}
