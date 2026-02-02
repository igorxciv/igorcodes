import { cn } from "@/lib/styles/cn";

import { CatNoteSection } from "./cat-note-section";
import { HeroSection } from "./hero-section";
import { WhatIDoSection } from "./what-i-do-section";

import type { HTMLAttributes } from "react";

type HomeMainProps = HTMLAttributes<HTMLElement>;

export function HomeMain({ className, ...restProps }: HomeMainProps) {
  return (
    <main className={cn("flex flex-col gap-16", className)} {...restProps}>
      <HeroSection />
      <WhatIDoSection />
      <CatNoteSection />
    </main>
  );
}
