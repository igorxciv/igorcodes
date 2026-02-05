import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";

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
import { formatDate } from "@/lib/formatters/date";
import { cn } from "@/lib/styles/cn";

import type { PostSummary } from "@/lib/types/posts";
import type { HTMLAttributes } from "react";

type BlogFeaturedProps = HTMLAttributes<HTMLElement> & {
  post?: PostSummary;
};

export function BlogFeatured({
  className,
  post,
  ...restProps
}: BlogFeaturedProps) {
  if (!post) {
    return null;
  }

  const href = `/blog/${post.slug}`;

  return (
    <section className={cn("flex flex-col gap-6", className)} {...restProps}>
      <BlogPostCard className="md:flex md:min-h-[320px]">
        <div className="md:w-1/2">
          <BlogPostMedia className="h-full md:h-[320px]" />
        </div>
        <BlogPostContent className="md:w-1/2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-zinc-500 uppercase dark:text-zinc-400">
            <BookOpen className="size-4" aria-hidden="true" />
            Featured Post
          </div>
          <BlogPostTitle className="text-2xl">{post.title}</BlogPostTitle>
          {post.description ? (
            <BlogPostDescription>{post.description}</BlogPostDescription>
          ) : null}
          {(!post.published ||
            post.topics.length > 0 ||
            post.tags.length > 0) && (
            <BlogPostTags>
              {!post.published && <BlogTag>Draft</BlogTag>}
              {post.topics.map((topic) => (
                <BlogTag key={`topic-${topic}`}>{topic}</BlogTag>
              ))}
              {post.tags.map((tag) => (
                <BlogTag key={`tag-${tag}`}>{tag}</BlogTag>
              ))}
            </BlogPostTags>
          )}
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
          <BlogPostLink href={href}>
            Read article
            <ArrowRight aria-hidden="true" className="size-4" />
          </BlogPostLink>
        </BlogPostContent>
      </BlogPostCard>
    </section>
  );
}
