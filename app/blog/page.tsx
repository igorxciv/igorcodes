import { SiteHeader, SiteShell } from "@/components/layout";
import { BlogMain } from "@/components/page-sections/blog";
import { getAllPosts } from "@/lib/server/posts";

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

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <SiteShell>
      <SiteHeader />
      <BlogMain posts={posts} />
    </SiteShell>
  );
}
