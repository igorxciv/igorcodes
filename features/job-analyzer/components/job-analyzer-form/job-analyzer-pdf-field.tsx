"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { JobAnalyzerDropzone } from "@/features/job-analyzer/components/job-analyzer-dropzone";
import { JobAnalyzerFieldHint } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-hint";
import { JobAnalyzerFieldLabel } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-field-label";
import { JobAnalyzerPdfSelected } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-pdf-selected";
import { cn } from "@/lib/styles/cn";

import type { JobAnalyzerFormApi } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerPdfFieldProps = {
  form: JobAnalyzerFormApi;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerPdfField({
  form,
  className,
  ...restProps
}: JobAnalyzerPdfFieldProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("flex flex-col gap-2", className)} {...restProps}>
      <form.Field name="jobFile">
        {(field) => (
          <>
            <JobAnalyzerFieldLabel htmlFor="job-pdf">
              Upload PDF
            </JobAnalyzerFieldLabel>
            <AnimatePresence mode="wait" initial={false}>
              {field.state.value ? (
                <motion.div
                  key="job-analyzer-file"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }
                  }
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <JobAnalyzerPdfSelected
                    fileName={(field.state.value as File).name}
                    onRemove={() => field.handleChange(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="job-analyzer-dropzone"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }
                  }
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <JobAnalyzerDropzone
                    id="job-pdf"
                    name={field.name}
                    onFileSelect={(file) => field.handleChange(file)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <JobAnalyzerFieldHint>PDF only, up to 10MB.</JobAnalyzerFieldHint>
          </>
        )}
      </form.Field>
    </div>
  );
}
