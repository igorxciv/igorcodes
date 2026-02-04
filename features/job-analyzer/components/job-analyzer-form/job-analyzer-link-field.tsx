"use client";

import { JobAnalyzerFieldHint } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-hint";
import { JobAnalyzerFieldLabel } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-label";
import { cn } from "@/lib/styles/cn";

import type { JobAnalyzerFormApi } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerLinkFieldProps = {
  form: JobAnalyzerFormApi;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerLinkField({
  form,
  className,
  ...restProps
}: JobAnalyzerLinkFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...restProps}>
      <form.Field name="jobUrl">
        {(field) => (
          <>
            <JobAnalyzerFieldLabel htmlFor="job-url">
              Job posting link
            </JobAnalyzerFieldLabel>
            <input
              id="job-url"
              name={field.name}
              value={field.state.value ?? ""}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="https://company.com/careers/job-posting"
              type="url"
              inputMode="url"
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby={
                field.state.meta.errors.length > 0 ? "job-url-error" : undefined
              }
              className="h-12 rounded-xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition outline-none focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {field.state.meta.errors.length > 0 ? (
              <p
                id="job-url-error"
                className="text-xs text-rose-600 dark:text-rose-300"
              >
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0]?.message ??
                    "Enter a valid URL.")}
              </p>
            ) : (
              <JobAnalyzerFieldHint>
                Use a direct link to the live posting.
              </JobAnalyzerFieldHint>
            )}
          </>
        )}
      </form.Field>
    </div>
  );
}
