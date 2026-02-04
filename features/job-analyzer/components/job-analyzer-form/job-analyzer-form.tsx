"use client";

import { JobAnalyzerFormBody } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-body";
import { JobAnalyzerFormHeader } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-header";
import { JobAnalyzerFormShell } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-shell";
import { JobAnalyzerSourceSummary } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-source-summary";
import { useJobAnalyzerForm } from "@/features/job-analyzer/hooks/use-job-analyzer-form";

import type { HTMLAttributes } from "react";

type JobAnalyzerFormProps = HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerForm({
  className,
  ...restProps
}: JobAnalyzerFormProps) {
  const { form, setSource, submitForm } = useJobAnalyzerForm();

  return (
    <JobAnalyzerFormShell className={className} {...restProps}>
      <JobAnalyzerFormHeader />
      <JobAnalyzerFormBody
        form={form}
        setSource={setSource}
        onSubmit={submitForm}
      />
      <JobAnalyzerSourceSummary />
    </JobAnalyzerFormShell>
  );
}
