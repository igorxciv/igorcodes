import { SiteHeader, SiteShell } from "@/components/layout";
import { ResumeMain } from "@/components/page-sections/resume";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Experience, skills, and education details for a systems-thinking product engineer.",
  alternates: {
    canonical: "/resume",
  },
};

export default function ResumePage() {
  return (
    <SiteShell>
      <SiteHeader />
      <ResumeMain />
    </SiteShell>
  );
}
