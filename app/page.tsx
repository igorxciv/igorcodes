import { SiteHeader, SiteShell } from "@/components/layout";
import { HomeMain } from "@/components/page-sections/home";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Igor — Principal Engineer",
  },
  description:
    "Personal site of Igor, a Principal Engineer at Electives. Building thoughtful software, live learning experiences, and AI-driven workflows.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Igor — Principal Engineer",
    description:
      "Personal site of Igor, a Principal Engineer at Electives. Building thoughtful software, live learning experiences, and AI-driven workflows.",
  },
  twitter: {
    title: "Igor — Principal Engineer",
    description:
      "Personal site of Igor, a Principal Engineer at Electives. Building thoughtful software, live learning experiences, and AI-driven workflows.",
  },
};

export default function Home() {
  return (
    <SiteShell>
      <SiteHeader />
      <HomeMain />
    </SiteShell>
  );
}
