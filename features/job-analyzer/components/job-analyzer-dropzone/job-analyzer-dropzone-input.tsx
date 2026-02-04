"use client";

import { cn } from "@/lib/styles/cn";

import type { ChangeEventHandler, InputHTMLAttributes } from "react";

type JobAnalyzerDropzoneInputProps = {
  onFileChange: ChangeEventHandler<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>;

export function JobAnalyzerDropzoneInput({
  onFileChange,
  className,
  ...restProps
}: JobAnalyzerDropzoneInputProps) {
  return (
    <input
      type="file"
      accept="application/pdf"
      onChange={onFileChange}
      className={cn("sr-only", className)}
      {...restProps}
    />
  );
}
