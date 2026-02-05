import { SiteHeader, SiteShell } from "@/components/layout";
import { ProjectsMain } from "@/components/page-sections/projects";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected projects across product engineering, platform systems, and AI-driven workflows.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | Igor",
    description:
      "Selected projects across product engineering, platform systems, and AI-driven workflows.",
  },
  twitter: {
    title: "Projects | Igor",
    description:
      "Selected projects across product engineering, platform systems, and AI-driven workflows.",
  },
};

export default function ProjectsPage() {
  return (
    <SiteShell>
      <SiteHeader />
      <ProjectsMain />
    </SiteShell>
  );
}
