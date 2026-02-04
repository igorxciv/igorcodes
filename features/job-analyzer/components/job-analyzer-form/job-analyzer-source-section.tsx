"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { JobAnalyzerSourcePanel } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-source-panel";
import { JobAnalyzerSourceTab } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-source-tab";
import { jobAnalyzerOptions } from "@/features/job-analyzer/constants/job-analyzer-options";

import type {
  JobAnalyzerFormApi,
  JobAnalyzerSourceValue,
} from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { HTMLAttributes } from "react";

type JobAnalyzerSourceSectionProps = {
  form: JobAnalyzerFormApi;
  setSource: (value: JobAnalyzerSourceValue) => void;
} & HTMLAttributes<HTMLDivElement>;

export function JobAnalyzerSourceSection({
  form,
  setSource,
  className,
  ...restProps
}: JobAnalyzerSourceSectionProps) {
  return (
    <div className={className} {...restProps}>
      <form.Subscribe selector={(state) => state.values.source}>
        {(source) => (
          <Tabs
            value={source}
            onValueChange={(value) =>
              setSource(value as JobAnalyzerSourceValue)
            }
          >
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 p-2 sm:grid-cols-3 dark:border-white/10 dark:bg-white/5">
              {jobAnalyzerOptions.map((option) => (
                <JobAnalyzerSourceTab
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  icon={option.icon}
                />
              ))}
            </TabsList>
            <div className="mt-4">
              <JobAnalyzerSourcePanel form={form} source={source} />
            </div>
          </Tabs>
        )}
      </form.Subscribe>
    </div>
  );
}
