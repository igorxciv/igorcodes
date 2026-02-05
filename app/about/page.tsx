import { SiteHeader, SiteShell } from "@/components/layout";
import { AboutMain } from "@/components/page-sections/about";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Story, values, and interests of Igor — a full-stack engineer since 2014 focused on thoughtful, human-centered software.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Igor",
    description:
      "Story, values, and interests of Igor — a full-stack engineer since 2014 focused on thoughtful, human-centered software.",
  },
  twitter: {
    title: "About | Igor",
    description:
      "Story, values, and interests of Igor — a full-stack engineer since 2014 focused on thoughtful, human-centered software.",
  },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <SiteHeader />
      <AboutMain />
    </SiteShell>
  );
}
