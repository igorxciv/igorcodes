import { cn } from "@/lib/styles/cn";

import { BlogFeatured } from "./blog-featured";
import { BlogHero } from "./blog-hero";
import { BlogRecent } from "./blog-recent";

import type { HTMLAttributes } from "react";

type BlogMainProps = HTMLAttributes<HTMLElement>;

export function BlogMain({ className, ...restProps }: BlogMainProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 pb-20 sm:px-10",
        className,
      )}
      {...restProps}
    >
      <BlogHero />
      <BlogFeatured />
      <BlogRecent />
    </main>
  );
}
