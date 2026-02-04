"use client";

import { Upload } from "lucide-react";

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
        "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200/80 bg-white/70 px-4 py-6 text-center text-sm text-zinc-500 transition dark:border-white/15 dark:bg-white/5 dark:text-zinc-300",
        isDragActive &&
          "border-emerald-400/70 bg-emerald-500/10 text-emerald-100",
        isDragReject && "border-rose-400/70 bg-rose-500/10 text-rose-200",
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
        <Upload aria-hidden="true" className="size-5" />
        <div className="text-sm font-semibold text-zinc-700 uppercase dark:text-zinc-100">
          {isDragReject ? "Only PDF files supported" : "Drop a PDF here"}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {isDragReject
            ? "Please drop a .pdf file"
            : "or click to browse (PDF only)"}
        </div>
      </div>
    </label>
  );
}
