"use client";

import { BriefcaseBusiness } from "lucide-react";

import {
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ResumeExperienceProps = HTMLAttributes<HTMLElement>;

interface ExperienceItem {
  role: string;
  company: string;
  companyUrl?: string;
  timeframe: string;
  current?: boolean;
  details: string[];
}

const factExperience: ExperienceItem[] = [
  {
    role: "Principal Engineer",
    company: "Electives",
    companyUrl: "https://electives.io",
    timeframe: "Nov 2022 - Present",
    current: true,
    details: [
      "Boosted membership page performance (3x faster cold Lambda starts, up to 4x faster hot starts).",
      "Built a local Lambda helper to run the serverless stack locally, reducing AWS costs and improving DX.",
      "Migrated AWS SDK v2 to v3 and led refactors for a more maintainable, scalable codebase.",
      "Established UI Kit + Storybook with CI/CD, and integrated it into the core product.",
      "Championed TypeScript, testing, and accessibility improvements across teams.",
      "Stack: React.js, Next.js, Node.js, TypeScript, GraphQL, AWS, Docker, Terraform, JMeter.",
    ],
  },
  {
    role: "Lead Software Engineer",
    company: "EPAM Systems",
    companyUrl: "https://epam.com",
    timeframe: "Nov 2017 - Nov 2022",
    details: [
      "Delivered Fortune 500 projects across e-commerce, finance, and media as a frontend/full-stack lead.",
      "Led distributed teams through development, release, and delivery.",
      "Built browser AR virtual try-on experiences (GLSL, WebGL, Three.js, TensorFlow).",
      "Designed SPAs with Angular, React, and Node.js; aligned solutions with product goals.",
      "Improved performance, accessibility, and DX; owned CI/CD and releases.",
      "Stack: React.js, Angular, Node.js, TypeScript, GraphQL, AWS, Docker, Three.js, WebGL.",
    ],
  },
  {
    role: "Web Developer",
    company: "Wargaming",
    companyUrl: "https://wargaming.net/en",
    timeframe: "Apr 2017 - Nov 2017",
    details: [
      "Raised unit test coverage from 0% to 88% by establishing a testing environment.",
      "Advised other teams on React.js adoption and best practices.",
      "Shipped new features using React and Knockout.",
      "Stack: JavaScript, React.js, Knockout.js, Go.",
    ],
  },
  {
    role: "Software Engineer",
    company: "EPAM Systems",
    companyUrl: "https://epam.com",
    timeframe: "Nov 2014 - Apr 2017",
    details: [
      "Built SPAs from scratch using React, Angular, AngularJS, and Node.js (BFF + backend).",
      "Designed and implemented UI mockups for internal applications.",
      "Set up CI/CD pipelines to ensure reliable delivery.",
      "Stack: JavaScript, React.js, Knockout.js, Node.js, TypeScript, GraphQL, AWS, Docker, Three.js.",
    ],
  },
];

const lyricalExperience: ExperienceItem[] = [
  {
    role: "Principal Engineer",
    company: "Electives",
    companyUrl: "https://electives.io",
    timeframe: "Nov 2022 - Present",
    current: true,
    details: [
      "Drove substantial business value by optimizing system performance and reducing AWS resource costs.",
      "Spearheaded a local Lambda helper, UI Kit development, and code refactoring to create a scalable and maintainable foundation.",
      "Led critical package migrations for a 30% performance boost and championed a lasting testing culture.",
      "Pioneered TypeScript adoption and accessibility improvements for a more inclusive, user-friendly product.",
      "Shaped architectural solutions for new business domains, supporting the company's growth trajectory.",
    ],
  },
  {
    role: "Lead Software Engineer",
    company: "EPAM Systems",
    companyUrl: "https://epam.com",
    timeframe: "Nov 2017 - Nov 2022",
    details: [
      "Led distributed teams delivering high-impact products for Fortune 500 clients across e-commerce, finance, and media.",
      "Built immersive AR virtual try-on experiences in browsers using GLSL, WebGL, Three.js, and TensorFlow.",
      "Shaped SPA architectures with Angular, React, and Node.js while aligning execution with business goals.",
      "Elevated performance, accessibility, and developer experience with rigorous CI/CD and release practices.",
    ],
  },
  {
    role: "Web Developer",
    company: "Wargaming",
    companyUrl: "https://wargaming.net/en",
    timeframe: "Apr 2017 - Nov 2017",
    details: [
      "Boosted code quality by establishing a testing environment and rapidly scaling unit test coverage.",
      "Guided other teams on React.js adoption and implementation patterns.",
      "Delivered new features with React and Knockout while raising the bar on maintainability.",
    ],
  },
  {
    role: "Software Engineer",
    company: "EPAM Systems",
    companyUrl: "https://epam.com",
    timeframe: "Nov 2014 - Apr 2017",
    details: [
      "Led SPA delivery from inception to production using React, Angular, AngularJS, and Node.js.",
      "Designed and implemented UI mockups that improved internal application usability.",
      "Hardened delivery pipelines with CI/CD practices for reliable releases.",
    ],
  },
];

export function ResumeExperience({
  className,
  ...restProps
}: ResumeExperienceProps) {
  return (
    <section className={cn("flex flex-col gap-8", className)} {...restProps}>
      <Tabs defaultValue="facts" className="gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <SectionEyebrow>
              <BriefcaseBusiness
                aria-hidden="true"
                className="size-3 text-emerald-300"
              />
              <span>./experience</span>
            </SectionEyebrow>
            <SectionTitle className="text-2xl sm:text-3xl">
              Experience
            </SectionTitle>
          </div>
          <TabsList
            className="rounded-full border border-zinc-200/80 bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/5"
            variant="default"
          >
            <TabsTrigger
              value="lyrically"
              className="rounded-full px-4 text-xs text-zinc-500 data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:text-zinc-400 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white"
            >
              lyrically
            </TabsTrigger>
            <TabsTrigger
              value="facts"
              className="rounded-full px-4 text-xs text-zinc-500 data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:text-zinc-400 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white"
            >
              facts
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="facts">
          <div className="space-y-8">
            {factExperience.map((item) => (
              <div
                key={`${item.role}-${item.company}`}
                className="flex flex-col gap-4 border-l border-zinc-200/70 pl-6 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {item.role}
                  </h3>
                  {item.current ? (
                    <Badge
                      variant="outline"
                      className="border-zinc-200/80 bg-white text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                    >
                      Current
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.companyUrl ? (
                    <a
                      className="underline-offset-4 transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-300"
                      href={item.companyUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.company}
                    </a>
                  ) : (
                    <span>{item.company}</span>
                  )}
                  <span className="text-zinc-400"> · </span>
                  <span>{item.timeframe}</span>
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-300/80" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="lyrically">
          <div className="space-y-8">
            {lyricalExperience.map((item) => (
              <div
                key={`${item.role}-${item.company}`}
                className="flex flex-col gap-4 border-l border-zinc-200/70 pl-6 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {item.role}
                  </h3>
                  {item.current ? (
                    <Badge
                      variant="outline"
                      className="border-zinc-200/80 bg-white text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                    >
                      Current
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.companyUrl ? (
                    <a
                      className="underline-offset-4 transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-300"
                      href={item.companyUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.company}
                    </a>
                  ) : (
                    <span>{item.company}</span>
                  )}
                  <span className="text-zinc-400"> · </span>
                  <span>{item.timeframe}</span>
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70 dark:bg-emerald-300/80" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
