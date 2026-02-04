import type { useJobAnalyzerForm } from "@/features/job-analyzer/hooks/use-job-analyzer-form";
import type { JobAnalyzerSource } from "@/features/job-analyzer/utils/job-analyzer-schema";

export type JobAnalyzerFormApi = ReturnType<typeof useJobAnalyzerForm>["form"];
export type JobAnalyzerSourceValue = JobAnalyzerSource;
