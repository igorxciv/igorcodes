import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";

import {
  BlogPostCard,
  BlogPostContent,
  BlogPostDescription,
  BlogPostLink,
  BlogPostMedia,
  BlogPostMeta,
  BlogPostTitle,
} from "@/components/page-sections/blog/blog-post-card";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type BlogFeaturedProps = HTMLAttributes<HTMLElement>;

export function BlogFeatured({ className, ...restProps }: BlogFeaturedProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)} {...restProps}>
      <BlogPostCard className="md:flex md:min-h-[320px]">
        <div className="md:w-1/2">
          <BlogPostMedia className="h-full md:h-[320px]" />
        </div>
        <BlogPostContent className="md:w-1/2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-zinc-400 uppercase">
            <BookOpen className="size-4" aria-hidden="true" />
            Featured Post
          </div>
          <BlogPostTitle className="text-2xl">
            Building Systems That Scale
          </BlogPostTitle>
          <BlogPostDescription>
            Lessons learned from architecting platforms that handle millions of
            users. How thinking in systems creates better software.
          </BlogPostDescription>
          <BlogPostMeta>
            <span className="inline-flex items-center gap-2">
              <Calendar className="size-4" aria-hidden="true" />
              Jan 15, 2026
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" aria-hidden="true" />8 min read
            </span>
          </BlogPostMeta>
          <BlogPostLink href="#">
            Read article
            <ArrowRight aria-hidden="true" className="size-4" />
          </BlogPostLink>
        </BlogPostContent>
      </BlogPostCard>
    </section>
  );
}
