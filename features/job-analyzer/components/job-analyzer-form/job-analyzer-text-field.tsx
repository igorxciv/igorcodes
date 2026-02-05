"use client";

import { JobAnalyzerFieldHint } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-hint";
import { JobAnalyzerFieldLabel } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-label";
import { cn } from "@/lib/styles/cn";

import type { JobAnalyzerFormApi } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerTextFieldProps = {
  form: JobAnalyzerFormApi;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerTextField({
  form,
  className,
  ...restProps
}: JobAnalyzerTextFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...restProps}>
      <form.Field name="jobText">
        {(field) => (
          <>
            <JobAnalyzerFieldLabel htmlFor="job-text">
              Job description
            </JobAnalyzerFieldLabel>
            <textarea
              id="job-text"
              name={field.name}
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Paste the job description here..."
              rows={6}
              className="min-h-35 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition outline-none focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <JobAnalyzerFieldHint>
              Include responsibilities, requirements, and skills for a richer
              match.
            </JobAnalyzerFieldHint>
          </>
        )}
      </form.Field>
    </div>
  );
}
