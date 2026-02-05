import { SiteHeader, SiteShell } from "@/components/layout";
import { BlogMain } from "@/components/page-sections/blog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on full-stack engineering, performance, accessibility, and AI agents.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | Igor",
    description:
      "Writing on full-stack engineering, performance, accessibility, and AI agents.",
  },
  twitter: {
    title: "Blog | Igor",
    description:
      "Writing on full-stack engineering, performance, accessibility, and AI agents.",
  },
};

export default function BlogPage() {
  return (
    <SiteShell>
      <SiteHeader />
      <BlogMain />
    </SiteShell>
  );
}
