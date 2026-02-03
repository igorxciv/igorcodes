import { cn } from "@/lib/styles/cn";

import { ProjectsGrid } from "./projects-grid";
import { ProjectsHero } from "./projects-hero";

import type { HTMLAttributes } from "react";

type ProjectsMainProps = HTMLAttributes<HTMLElement>;

export function ProjectsMain({ className, ...restProps }: ProjectsMainProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 pb-20 sm:px-10",
        className,
      )}
      {...restProps}
    >
      <ProjectsHero />
      <ProjectsGrid />
    </main>
  );
}
