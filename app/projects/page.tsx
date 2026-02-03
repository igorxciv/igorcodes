import { SiteHeader, SiteShell } from "@/components/layout";
import { ProjectsMain } from "@/components/page-sections/projects";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore a curated set of tools, platforms, and systems built to create leverage and solve real-world problems.",
  alternates: {
    canonical: "/projects",
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
