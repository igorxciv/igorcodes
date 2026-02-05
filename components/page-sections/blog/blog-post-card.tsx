import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { MicroInteractionLink } from "@/components/ui/micro-interaction-link";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";

type BlogPostCardProps = HTMLAttributes<HTMLDivElement>;

type BlogPostMediaProps = HTMLAttributes<HTMLDivElement>;

type BlogPostTagsProps = HTMLAttributes<HTMLDivElement>;

type BlogPostMetaProps = HTMLAttributes<HTMLDivElement>;

type BlogPostLinkProps = ComponentPropsWithoutRef<typeof MicroInteractionLink>;

export function BlogPostCard({
  className,
  children,
  ...restProps
}: BlogPostCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-zinc-200/70 bg-white dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...restProps}
    >
      {children}
    </Card>
  );
}

export function BlogPostMedia({ className, ...restProps }: BlogPostMediaProps) {
  return (
    <div
      className={cn(
        "relative h-44 w-full border-b border-zinc-200/70 bg-[linear-gradient(135deg,_rgba(37,99,235,0.12),_rgba(226,232,240,0.9))] dark:border-white/10 dark:bg-[linear-gradient(135deg,_rgba(59,130,246,0.18),_rgba(15,23,42,0.6))]",
        className,
      )}
      {...restProps}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_70%)]" />
      <div className="relative flex h-full items-center justify-center text-xs font-semibold tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-300">
        Image Placeholder
      </div>
    </div>
  );
}

export function BlogPostContent({
  className,
  ...restProps
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <CardContent className={cn("space-y-4 p-6", className)} {...restProps} />
  );
}

export function BlogPostTitle({
  className,
  ...restProps
}: HTMLAttributes<HTMLHeadingElement>) {
  return <CardTitle className={cn("text-lg", className)} {...restProps} />;
}

export function BlogPostDescription({
  className,
  ...restProps
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <CardDescription
      className={cn(
        "text-sm leading-relaxed text-zinc-600 dark:text-zinc-400",
        className,
      )}
      {...restProps}
    />
  );
}

export function BlogPostTags({ className, ...restProps }: BlogPostTagsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2 text-xs", className)}
      {...restProps}
    />
  );
}

export function BlogTag({
  className,
  ...restProps
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-zinc-200/80 bg-white text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
        className,
      )}
      {...restProps}
    />
  );
}

export function BlogPostMeta({ className, ...restProps }: BlogPostMetaProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400",
        className,
      )}
      {...restProps}
    />
  );
}

export function BlogPostLink({ className, ...restProps }: BlogPostLinkProps) {
  return (
    <MicroInteractionLink
      preset="text"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white",
        className,
      )}
      {...restProps}
    />
  );
}
