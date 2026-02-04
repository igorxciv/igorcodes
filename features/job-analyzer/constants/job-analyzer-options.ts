import { FileText, Link2, Upload } from "lucide-react";

import type { JobAnalyzerSource } from "@/features/job-analyzer/utils/job-analyzer-schema";

interface JobAnalyzerOption {
  value: JobAnalyzerSource;
  label: string;
  description: string;
  icon: typeof FileText;
}

export const jobAnalyzerOptions: JobAnalyzerOption[] = [
  {
    value: "text",
    label: "Text",
    description: "Paste a full job description.",
    icon: FileText,
  },
  {
    value: "link",
    label: "Link",
    description: "Use the posting URL.",
    icon: Link2,
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Upload a PDF posting.",
    icon: Upload,
  },
];
