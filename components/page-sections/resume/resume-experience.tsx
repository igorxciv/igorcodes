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
  timeframe: string;
  current?: boolean;
  details: string[];
}

const factExperience: ExperienceItem[] = [
  {
    role: "Senior Product Engineer",
    company: "Tech Company",
    timeframe: "2022 - Present",
    current: true,
    details: [
      "Led the architectural vision for AI-powered features serving 100k+ users, improving onboarding completion by 22% and retention by 18%.",
      "Reduced operational costs by 30% through infrastructure optimization and a multi-region caching strategy.",
      "Built a design system adopted by 6 product teams, cutting UI delivery time by 35%.",
      "Mentored 4 engineers and established architecture reviews for cross-team alignment.",
    ],
  },
  {
    role: "Product Engineer",
    company: "Startup",
    timeframe: "2020 - 2022",
    details: [
      "Owned the full product lifecycle for collaboration features that increased weekly active usage by 28%.",
      "Designed real-time sync workflows that reduced conflict resolution time by 40%.",
      "Shipped data-informed experiments, improving conversion rates by 12%.",
    ],
  },
  {
    role: "Software Engineer",
    company: "Agency",
    timeframe: "2018 - 2020",
    details: [
      "Delivered client platforms across fintech, healthcare, and education with consistent quality.",
      "Built modern web apps using React, Node.js, and cloud infrastructure for end-to-end delivery.",
    ],
  },
];

const lyricalExperience: ExperienceItem[] = [
  {
    role: "Senior Product Engineer",
    company: "Tech Company",
    timeframe: "2022 - Present",
    current: true,
    details: [
      "Guided AI experiences that feel effortless for 100k+ users while holding the line on reliability at scale.",
      "Turned infrastructure sprawl into a resilient system that compounds performance and reduces cost.",
      "Crafted a design system that unified how teams build, accelerating velocity without sacrificing craft.",
      "Mentored engineers to think in systems, not tasks, for stronger architecture decisions.",
    ],
  },
  {
    role: "Product Engineer",
    company: "Startup",
    timeframe: "2020 - 2022",
    details: [
      "Took ideas from sketch to shipped and turned them into features customers kept coming back to.",
      "Pioneered real-time collaboration flows that made remote teamwork feel seamless.",
      "Built a habit of experimentation, translating intuition into measurable outcomes.",
    ],
  },
  {
    role: "Software Engineer",
    company: "Agency",
    timeframe: "2018 - 2020",
    details: [
      "Shipped diverse client work with equal parts adaptability and polish.",
      "Grew from frontend craft to full-stack confidence through hands-on delivery.",
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
            className="rounded-full border border-white/10 bg-white/5 p-1"
            variant="default"
          >
            <TabsTrigger
              value="lyrically"
              className="rounded-full px-4 text-xs text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              lyrically
            </TabsTrigger>
            <TabsTrigger
              value="facts"
              className="rounded-full px-4 text-xs text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
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
                className="flex flex-col gap-4 border-l border-white/10 pl-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {item.role}
                  </h3>
                  {item.current ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-[11px] text-zinc-200"
                    >
                      Current
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-400">
                  {item.company} · {item.timeframe}
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-zinc-400">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
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
                className="flex flex-col gap-4 border-l border-white/10 pl-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {item.role}
                  </h3>
                  {item.current ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-[11px] text-zinc-200"
                    >
                      Current
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-400">
                  {item.company} · {item.timeframe}
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-zinc-400">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
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
