import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement>;

type SectionEyebrowProps = HTMLAttributes<HTMLSpanElement>;

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement>;

type SectionDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function SectionHeader({ className, ...restProps }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} {...restProps} />
  );
}

export function SectionEyebrow({
  className,
  ...restProps
}: SectionEyebrowProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 border-zinc-200 bg-zinc-100 font-mono text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
        className,
      )}
      {...restProps}
    />
  );
}

export function SectionTitle({ className, ...restProps }: SectionTitleProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-white",
        className,
      )}
      {...restProps}
    />
  );
}

export function SectionDescription({
  className,
  ...restProps
}: SectionDescriptionProps) {
  return (
    <p
      className={cn(
        "max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-300",
        className,
      )}
      {...restProps}
    />
  );
}
