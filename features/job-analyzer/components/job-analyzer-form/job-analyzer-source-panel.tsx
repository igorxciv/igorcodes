"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { JobAnalyzerSourceFields } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-source-fields";

import type {
  JobAnalyzerFormApi,
  JobAnalyzerSourceValue,
} from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerSourcePanelProps = {
  form: JobAnalyzerFormApi;
  source: JobAnalyzerSourceValue;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerSourcePanel({
  form,
  source,
  className,
  ...restProps
}: JobAnalyzerSourcePanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className} {...restProps}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={source}
          role="tabpanel"
          id={`job-analyzer-panel-${source}`}
          aria-labelledby={`job-analyzer-tab-${source}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flex flex-col gap-2"
        >
          <JobAnalyzerSourceFields form={form} source={source} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
