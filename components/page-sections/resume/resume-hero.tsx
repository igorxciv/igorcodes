import { Download, Terminal } from "lucide-react";

import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ResumeHeroProps = HTMLAttributes<HTMLElement>;

export function ResumeHero({ className, ...restProps }: ResumeHeroProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)} {...restProps}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4">
          <SectionEyebrow>
            <Terminal aria-hidden="true" className="size-3 text-emerald-300" />
            <span>$ cat resume.pdf</span>
          </SectionEyebrow>
          <SectionTitle className="text-4xl sm:text-5xl">Resume</SectionTitle>
        </div>
        <Button variant="outline" className="self-start">
          <Download aria-hidden="true" />
          Download PDF
        </Button>
      </div>
      <SectionDescription className="max-w-2xl text-base sm:text-lg">
        Systems-thinking builder with expertise in architecture, AI
        infrastructure, and product development.
      </SectionDescription>
    </section>
  );
}
