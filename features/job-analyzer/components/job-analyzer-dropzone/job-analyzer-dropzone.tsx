"use client";

import { JobAnalyzerDropzoneInput } from "@/features/job-analyzer/components/job-analyzer-dropzone/job-analyzer-dropzone-input";
import { JobAnalyzerDropzoneRoot } from "@/features/job-analyzer/components/job-analyzer-dropzone/job-analyzer-dropzone-root";
import { JobAnalyzerDropzoneStatus } from "@/features/job-analyzer/components/job-analyzer-dropzone/job-analyzer-dropzone-status";
import { useJobAnalyzerFileDropzone } from "@/features/job-analyzer/hooks/use-job-analyzer-file-dropzone";

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
    <JobAnalyzerDropzoneRoot
      isDragActive={isDragActive}
      isDragReject={isDragReject}
      className={className}
      onDragEnter={startDrag}
      onDragLeave={endDrag}
      onDragOver={allowDrop}
      onDrop={dropFile}
      {...restProps}
    >
      <JobAnalyzerDropzoneInput
        id={id}
        name={name}
        onFileChange={setFileFromInput}
      />
      <JobAnalyzerDropzoneStatus isDragReject={isDragReject} />
    </JobAnalyzerDropzoneRoot>
  );
}

export type { JobAnalyzerDropzoneProps };
