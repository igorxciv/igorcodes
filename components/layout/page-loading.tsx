import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { cn } from "@/lib/styles/cn";

import { SiteHeader } from "./site-header";
import { SiteShell } from "./site-shell";

import type { HTMLAttributes } from "react";

type PageLoadingProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  eyebrow?: string;
  description?: string;
};

export function PageLoading({
  title,
  eyebrow,
  description,
  className,
  ...restProps
}: PageLoadingProps) {
  return (
    <SiteShell>
      <SiteHeader />
      <main
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-10 pb-20 sm:px-10",
          className,
        )}
        {...restProps}
      >
        <div className="flex flex-col gap-4">
          {eyebrow ? (
            <SectionEyebrow>
              <span>{eyebrow}</span>
            </SectionEyebrow>
          ) : null}
          <SectionTitle className="text-3xl sm:text-4xl">{title}</SectionTitle>
          {description ? (
            <SectionDescription className="max-w-2xl text-base sm:text-lg">
              {description}
            </SectionDescription>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-3 w-full max-w-xl rounded-full bg-zinc-200/70 dark:bg-white/10" />
          <div className="h-3 w-5/6 max-w-lg rounded-full bg-zinc-200/60 dark:bg-white/10" />
          <div className="h-3 w-2/3 max-w-md rounded-full bg-zinc-200/50 dark:bg-white/10" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-60 rounded-3xl border border-zinc-200/80 bg-zinc-100/70 dark:border-white/10 dark:bg-white/5" />
          <div className="h-60 rounded-3xl border border-zinc-200/80 bg-zinc-100/70 dark:border-white/10 dark:bg-white/5" />
        </div>
      </main>
    </SiteShell>
  );
}
