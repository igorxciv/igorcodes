import { cn } from "@/lib/styles/cn";

import { AboutHero } from "./about-hero";
import { AboutInterests } from "./about-interests";
import { AboutValues } from "./about-values";

import type { HTMLAttributes } from "react";

type AboutMainProps = HTMLAttributes<HTMLElement>;

export function AboutMain({ className, ...restProps }: AboutMainProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pt-10 pb-20 sm:px-10",
        className,
      )}
      {...restProps}
    >
      <AboutHero />
      <AboutValues />
      <AboutInterests />
    </main>
  );
}
