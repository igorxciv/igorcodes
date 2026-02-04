"use client";

import { CircleX, Upload } from "lucide-react";

import { useJobAnalyzerFileDropzone } from "@/features/job-analyzer/hooks/use-job-analyzer-file-dropzone";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type JobAnalyzerDropzoneProps = {
  id: string;
  name: string;
  onFileSelect: (file: File | null) => void;
} & HTMLAttributes<HTMLLabelElement>;

export function JobAnalyzerDropzone({
  id,
  name,
  onFileSelect,
  className,
  ...restProps
}: JobAnalyzerDropzoneProps) {
  const {
    isDragActive,
    isDragReject,
    startDrag,
    endDrag,
    allowDrop,
    dropFile,
    setFileFromInput,
  } = useJobAnalyzerFileDropzone({ onFileSelect });

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
      onDragEnter={startDrag}
      onDragLeave={endDrag}
      onDragOver={allowDrop}
      onDrop={dropFile}
      aria-invalid={isDragReject}
      {...restProps}
    >
      <input
        id={id}
        name={name}
        type="file"
        accept="application/pdf"
        onChange={setFileFromInput}
        className="sr-only"
      />
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
    </label>
  );
}
