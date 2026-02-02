import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type FeatureGridProps = HTMLAttributes<HTMLDivElement>;

export function FeatureGrid({ className, ...restProps }: FeatureGridProps) {
  return (
    <div
      className={cn("grid gap-6 md:grid-cols-2", className)}
      {...restProps}
    />
  );
}
