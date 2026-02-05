import { ArrowRight, Calendar, Clock } from "lucide-react";

import {
  BlogPostCard,
  BlogPostContent,
  BlogPostDescription,
  BlogPostLink,
  BlogPostMedia,
  BlogPostMeta,
  BlogPostTags,
  BlogPostTitle,
  BlogTag,
} from "@/components/page-sections/blog/blog-post-card";
import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import { formatDate } from "@/lib/formatters/date";
import { cn } from "@/lib/styles/cn";

import type { PostSummary } from "@/lib/types/posts";
import type { HTMLAttributes } from "react";

type BlogRecentProps = HTMLAttributes<HTMLElement> & {
  posts: PostSummary[];
};

export function BlogRecent({
  className,
  posts,
  ...restProps
}: BlogRecentProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className={cn("flex flex-col gap-8", className)} {...restProps}>
      <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-white">
        Recent posts
      </h2>
      <FeatureGrid className="md:grid-cols-2">
        {posts.map((post) => (
          <BlogPostCard key={post.slug}>
            <BlogPostMedia />
            <BlogPostContent>
              {(!post.published ||
                post.topics.length > 0 ||
                post.tags.length > 0) && (
                <BlogPostTags>
                  {!post.published && <BlogTag>Draft</BlogTag>}
                  {post.topics.map((topic) => (
                    <BlogTag key={`${post.slug}-topic-${topic}`}>
                      {topic}
                    </BlogTag>
                  ))}
                  {post.tags.map((tag) => (
                    <BlogTag key={`${post.slug}-tag-${tag}`}>{tag}</BlogTag>
                  ))}
                </BlogPostTags>
              )}
              <BlogPostTitle>{post.title}</BlogPostTitle>
              {post.description ? (
                <BlogPostDescription>{post.description}</BlogPostDescription>
              ) : null}
              <BlogPostMeta>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4" aria-hidden="true" />
                  {formatDate(post.date)}
                </span>
                {post.readingTime ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="size-4" aria-hidden="true" />
                    {post.readingTime} min read
                  </span>
                ) : null}
              </BlogPostMeta>
              <BlogPostLink href={`/blog/${post.slug}`}>
                Read article
                <ArrowRight aria-hidden="true" className="size-4" />
              </BlogPostLink>
            </BlogPostContent>
          </BlogPostCard>
        ))}
      </FeatureGrid>
    </section>
  );
}
