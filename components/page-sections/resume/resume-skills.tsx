import { BookOpen } from "lucide-react";

import {
  FeatureCard,
  FeatureCardDescription,
  FeatureCardTitle,
} from "@/components/page-sections/shared/feature-card";
import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import {
  SectionEyebrow,
  SectionTitle,
} from "@/components/page-sections/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ResumeSkillsProps = HTMLAttributes<HTMLElement>;

interface SkillGroup {
  title: string;
  description: string;
  items: string[];
}

const skillGroups: SkillGroup[] = [
  {
    title: "Frontend & UI",
    description: "Web application and interface development.",
    items: [
      "React.js",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Angular",
      "AngularJS",
      "Knockout.js",
      "Storybook",
      "Three.js",
      "WebGL",
    ],
  },
  {
    title: "Backend & Cloud",
    description: "APIs, infrastructure, and platform tooling.",
    items: [
      "Node.js",
      "GraphQL",
      "AWS",
      "Docker",
      "Terraform",
      "Serverless",
      "Microservices",
      "Go",
    ],
  },
  {
    title: "Engineering Practices",
    description: "Quality, delivery, and performance.",
    items: [
      "Testing",
      "CI/CD",
      "Performance Optimization",
      "Accessibility",
      "Load Testing (JMeter)",
      "System Design",
    ],
  },
];

export function ResumeSkills({ className, ...restProps }: ResumeSkillsProps) {
  return (
    <section className={cn("flex flex-col gap-8", className)} {...restProps}>
      <div className="flex flex-col gap-3">
        <SectionEyebrow>
          <BookOpen aria-hidden="true" className="size-3 text-emerald-300" />
          <span>./skills</span>
        </SectionEyebrow>
        <SectionTitle className="text-2xl sm:text-3xl">Skills</SectionTitle>
      </div>
      <FeatureGrid className="md:grid-cols-3">
        {skillGroups.map((group) => (
          <FeatureCard
            key={group.title}
            className="border-zinc-200/70 bg-white dark:border-white/10 dark:bg-white/5"
          >
            <FeatureCardTitle>{group.title}</FeatureCardTitle>
            <FeatureCardDescription>{group.description}</FeatureCardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="border-zinc-200/80 bg-white text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </FeatureCard>
        ))}
      </FeatureGrid>
    </section>
  );
}
