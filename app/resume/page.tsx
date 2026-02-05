import { SiteHeader, SiteShell } from "@/components/layout";
import { ResumeMain } from "@/components/page-sections/resume";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume for Igor — Principal Engineer with experience at Electives, EPAM, and Wargaming. Focused on performance, accessibility, and scalable systems.",
  alternates: {
    canonical: "/resume",
  },
  openGraph: {
    title: "Resume | Igor",
    description:
      "Resume for Igor — Principal Engineer with experience at Electives, EPAM, and Wargaming. Focused on performance, accessibility, and scalable systems.",
  },
  twitter: {
    title: "Resume | Igor",
    description:
      "Resume for Igor — Principal Engineer with experience at Electives, EPAM, and Wargaming. Focused on performance, accessibility, and scalable systems.",
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
