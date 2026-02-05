import { cn } from "@/lib/styles/cn";

import { BlogFeatured } from "./blog-featured";
import { BlogHero } from "./blog-hero";
import { BlogRecent } from "./blog-recent";

import type { PostSummary } from "@/lib/types/posts";
import type { HTMLAttributes } from "react";

type BlogMainProps = HTMLAttributes<HTMLElement> & {
  posts: PostSummary[];
};

export function BlogMain({ className, posts, ...restProps }: BlogMainProps) {
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const recent = posts
    .filter((post) => post.slug !== featured?.slug)
    .slice(0, 4);

  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 pb-20 sm:px-10",
        className,
      )}
      {...restProps}
    >
      <BlogHero />
      {posts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-200/70 bg-white/60 p-8 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          No posts yet. Add your first MDX file in{" "}
          <code className="rounded-md bg-white/70 px-2 py-1 font-mono text-[0.85em] text-zinc-800 dark:bg-white/10 dark:text-zinc-200">
            content/posts
          </code>{" "}
          to get started.
        </section>
      ) : (
        <>
          <BlogFeatured post={featured} />
          <BlogRecent posts={recent} />
        </>
      )}
    </main>
  );
}
