import { SiteHeader, SiteShell } from "@/components/layout";
import { BlogMain } from "@/components/page-sections/blog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on systems thinking, product engineering, and building tools that create leverage.",
  alternates: {
    canonical: "/blog",
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
