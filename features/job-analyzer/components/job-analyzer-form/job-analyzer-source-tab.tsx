"use client";

import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/styles/cn";

import type { JobAnalyzerSourceValue } from "@/features/job-analyzer/components/job-analyzer-form/job-analyzer-form-types";
import type { ElementType, HTMLAttributes } from "react";

type JobAnalyzerSourceTabProps = {
  value: JobAnalyzerSourceValue;
  label: string;
  icon: ElementType;
} & HTMLAttributes<HTMLButtonElement>;

export function JobAnalyzerSourceTab({
  value,
  label,
  icon: Icon,
  className,
  ...restProps
}: JobAnalyzerSourceTabProps) {
  const triggerId = `job-analyzer-tab-${value}`;
  const panelId = `job-analyzer-panel-${value}`;

  return (
    <TabsTrigger
      value={value}
      id={triggerId}
      aria-controls={panelId}
      className={cn(
        "h-10 w-full justify-start gap-2 rounded-lg border border-transparent px-3 text-xs font-semibold text-zinc-500 uppercase data-[state=active]:border-zinc-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 sm:h-[calc(100%-1px)] sm:flex-1 sm:justify-center dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white",
        className,
      )}
      {...restProps}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </TabsTrigger>
  );
}
