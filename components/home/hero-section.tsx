import { cn } from "@/lib/styles/cn";

import { HeroIntro } from "./hero-intro";
import { HeroVisual } from "./hero-visual";

import type { HTMLAttributes } from "react";

type HeroSectionProps = HTMLAttributes<HTMLElement>;

export function HeroSection({ className, ...restProps }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]",
        className,
      )}
      {...restProps}
    >
      <HeroIntro />
      <HeroVisual />
    </section>
  );
}
