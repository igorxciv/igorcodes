"use client";

import { JobAnalyzerSourceSection } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-source-section";
import { JobAnalyzerSubmitButton } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-submit-button";
import { cn } from "@/lib/styles/cn";

import type {
  JobAnalyzerFormApi,
  JobAnalyzerSourceValue,
} from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes, SubmitEvent } from "react";

type JobAnalyzerFormBodyProps = {
  form: JobAnalyzerFormApi;
  setSource: (value: JobAnalyzerSourceValue) => void;
  onSubmit: (event: SubmitEvent) => void;
} & HTMLAttributes<HTMLFormElement>;

export function JobAnalyzerFormBody({
  form,
  setSource,
  onSubmit,
  className,
  ...restProps
}: JobAnalyzerFormBodyProps) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("flex flex-col gap-4", className)}
      {...restProps}
    >
      <JobAnalyzerSourceSection form={form} setSource={setSource} />
      <JobAnalyzerSubmitButton />
    </form>
  );
}
