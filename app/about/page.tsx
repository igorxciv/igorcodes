import { SiteHeader, SiteShell } from "@/components/layout";
import { AboutMain } from "@/components/page-sections/about";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about the builder behind the work, the values that drive the craft, and the interests beyond the code.",
  alternates: {
    canonical: "/about",
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
