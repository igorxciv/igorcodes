"use client";

import { JobAnalyzerLinkField } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-link-field";
import { JobAnalyzerPdfField } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-pdf-field";
import { JobAnalyzerTextField } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-text-field";

import type {
  JobAnalyzerFormApi,
  JobAnalyzerSourceValue,
} from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerSourceFieldsProps = {
  form: JobAnalyzerFormApi;
  source: JobAnalyzerSourceValue;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerSourceFields({
  form,
  source,
  className,
  ...restProps
}: JobAnalyzerSourceFieldsProps) {
  return (
    <div className={className} {...restProps}>
      {source === "text" && <JobAnalyzerTextField form={form} />}
      {source === "link" && <JobAnalyzerLinkField form={form} />}
      {source === "pdf" && <JobAnalyzerPdfField form={form} />}
    </div>
  );
}
