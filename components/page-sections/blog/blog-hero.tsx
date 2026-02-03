import { Terminal } from "lucide-react";

import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type BlogHeroProps = HTMLAttributes<HTMLElement>;

export function BlogHero({ className, ...restProps }: BlogHeroProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)} {...restProps}>
      <SectionEyebrow>
        <Terminal aria-hidden="true" className="size-3 text-emerald-300" />
        <span>$ cat blog/*.md</span>
      </SectionEyebrow>
      <SectionTitle className="text-3xl sm:text-4xl">Blog</SectionTitle>
      <SectionDescription className="max-w-2xl text-base sm:text-lg">
        Thoughts on systems thinking, product engineering, and building tools
        that create leverage. Writing to clarify my own thinking and share what
        I learn.
      </SectionDescription>
    </section>
  );
}
