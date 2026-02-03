import { cn } from "@/lib/styles/cn";

import { ResumeEducation } from "./resume-education";
import { ResumeExperience } from "./resume-experience";
import { ResumeHero } from "./resume-hero";
import { ResumeSkills } from "./resume-skills";

import type { HTMLAttributes } from "react";

type ResumeMainProps = HTMLAttributes<HTMLElement>;

export function ResumeMain({ className, ...restProps }: ResumeMainProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 pb-20 sm:px-10",
        className,
      )}
      {...restProps}
    >
      <ResumeHero />
      <ResumeExperience />
      <ResumeSkills />
      <ResumeEducation />
    </main>
  );
}
