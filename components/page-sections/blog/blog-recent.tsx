import { Calendar, Clock } from "lucide-react";

import {
  BlogPostCard,
  BlogPostContent,
  BlogPostDescription,
  BlogPostMedia,
  BlogPostMeta,
  BlogPostTags,
  BlogPostTitle,
  BlogTag,
} from "@/components/page-sections/blog/blog-post-card";
import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type BlogRecentProps = HTMLAttributes<HTMLElement>;

export function BlogRecent({ className, ...restProps }: BlogRecentProps) {
  return (
    <section className={cn("flex flex-col gap-8", className)} {...restProps}>
      <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-white">
        Recent posts
      </h2>
      <FeatureGrid className="md:grid-cols-2">
        <BlogPostCard>
          <BlogPostMedia className="bg-[linear-gradient(135deg,_rgba(34,197,94,0.14),_rgba(226,232,240,0.9))] dark:bg-[linear-gradient(135deg,_rgba(34,197,94,0.18),_rgba(15,23,42,0.65))]" />
          <BlogPostContent>
            <BlogPostTags>
              <BlogTag>Strategy</BlogTag>
              <BlogTag>Career</BlogTag>
            </BlogPostTags>
            <BlogPostTitle>The Art of Long-term Leverage</BlogPostTitle>
            <BlogPostDescription>
              Why building tools and infrastructure compounds over time. A
              framework for thinking about what work creates the most value.
            </BlogPostDescription>
            <BlogPostMeta>
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" aria-hidden="true" />
                Jan 8, 2026
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />6 min read
              </span>
            </BlogPostMeta>
          </BlogPostContent>
        </BlogPostCard>
        <BlogPostCard>
          <BlogPostMedia className="bg-[linear-gradient(135deg,_rgba(99,102,241,0.14),_rgba(226,232,240,0.9))] dark:bg-[linear-gradient(135deg,_rgba(99,102,241,0.18),_rgba(15,23,42,0.65))]" />
          <BlogPostContent>
            <BlogPostTags>
              <BlogTag>AI</BlogTag>
              <BlogTag>Infrastructure</BlogTag>
            </BlogPostTags>
            <BlogPostTitle>AI Infrastructure in Production</BlogPostTitle>
            <BlogPostDescription>
              Real-world patterns for deploying AI features at scale. From
              prompt engineering to caching strategies that actually work.
            </BlogPostDescription>
            <BlogPostMeta>
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" aria-hidden="true" />
                Dec 28, 2025
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />
                10 min read
              </span>
            </BlogPostMeta>
          </BlogPostContent>
        </BlogPostCard>
        <BlogPostCard>
          <BlogPostMedia className="bg-[linear-gradient(135deg,_rgba(251,191,36,0.14),_rgba(226,232,240,0.9))] dark:bg-[linear-gradient(135deg,_rgba(251,191,36,0.18),_rgba(15,23,42,0.65))]" />
          <BlogPostContent>
            <BlogPostTags>
              <BlogTag>Design</BlogTag>
              <BlogTag>React</BlogTag>
            </BlogPostTags>
            <BlogPostTitle>Design Systems as Code</BlogPostTitle>
            <BlogPostDescription>
              How to bridge design intent and implementation through reusable
              components, tokens, and modern tooling.
            </BlogPostDescription>
            <BlogPostMeta>
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" aria-hidden="true" />
                Dec 12, 2025
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />7 min read
              </span>
            </BlogPostMeta>
          </BlogPostContent>
        </BlogPostCard>
        <BlogPostCard>
          <BlogPostMedia className="bg-[linear-gradient(135deg,_rgba(45,212,191,0.14),_rgba(226,232,240,0.9))] dark:bg-[linear-gradient(135deg,_rgba(45,212,191,0.18),_rgba(15,23,42,0.65))]" />
          <BlogPostContent>
            <BlogPostTags>
              <BlogTag>Career</BlogTag>
              <BlogTag>Culture</BlogTag>
            </BlogPostTags>
            <BlogPostTitle>High Agency Engineering</BlogPostTitle>
            <BlogPostDescription>
              The habits, rituals, and mindset shifts that help teams ship
              faster without sacrificing craft.
            </BlogPostDescription>
            <BlogPostMeta>
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" aria-hidden="true" />
                Nov 21, 2025
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />5 min read
              </span>
            </BlogPostMeta>
          </BlogPostContent>
        </BlogPostCard>
      </FeatureGrid>
    </section>
  );
}
