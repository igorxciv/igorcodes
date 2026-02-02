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
  return <Badge className={cn("font-mono", className)} {...restProps} />;
}

export function SectionTitle({ className, ...restProps }: SectionTitleProps) {
  return (
    <h2
      className={cn("text-2xl font-semibold text-white sm:text-3xl", className)}
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
        "max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base",
        className,
      )}
      {...restProps}
    />
  );
}
