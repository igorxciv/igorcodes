import { z } from "zod";

export const jobAnalyzerSchema = z
  .object({
    source: z.enum(["text", "link", "pdf"]),
    jobText: z.string().optional(),
    jobUrl: z.string().url().optional().or(z.literal("")),
    jobFile: z.any().nullable().optional(),
  })
  .superRefine((values, context) => {
    if (values.source === "link" && !values.jobUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobUrl"],
        message: "A valid job posting URL is required.",
      });
    }
  });

export type JobAnalyzerValues = z.infer<typeof jobAnalyzerSchema>;

export type JobAnalyzerSource = JobAnalyzerValues["source"];
