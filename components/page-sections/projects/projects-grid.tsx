import { Code, ExternalLink } from "lucide-react";

import {
  ProjectCard,
  ProjectCardActions,
  ProjectCardContent,
  ProjectCardDescription,
  ProjectCardMedia,
  ProjectCardTags,
  ProjectCardTitle,
  ProjectLink,
  ProjectTag,
} from "@/components/page-sections/projects/project-card";
import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type ProjectsGridProps = HTMLAttributes<HTMLElement>;

export function ProjectsGrid({ className, ...restProps }: ProjectsGridProps) {
  return (
    <section className={cn("flex flex-col gap-10", className)} {...restProps}>
      <FeatureGrid className="md:grid-cols-2">
        <ProjectCard>
          <ProjectCardMedia />
          <ProjectCardContent>
            <ProjectCardTitle>AI Content Platform</ProjectCardTitle>
            <ProjectCardDescription>
              A full-stack platform for generating and managing AI-powered
              content. Built with React, Node.js, and the OpenAI API. Handles
              10k+ requests daily with robust caching and optimization.
            </ProjectCardDescription>
            <ProjectCardTags>
              <ProjectTag>React</ProjectTag>
              <ProjectTag>Node.js</ProjectTag>
              <ProjectTag>OpenAI</ProjectTag>
              <ProjectTag>PostgreSQL</ProjectTag>
            </ProjectCardTags>
            <ProjectCardActions>
              <ProjectLink href="#">
                <Code aria-hidden="true" />
                Code
              </ProjectLink>
              <ProjectLink href="#">
                <ExternalLink aria-hidden="true" />
                Live Demo
              </ProjectLink>
            </ProjectCardActions>
          </ProjectCardContent>
        </ProjectCard>
        <ProjectCard>
          <ProjectCardMedia className="bg-[linear-gradient(135deg,_rgba(45,212,191,0.18),_rgba(15,23,42,0.6))]" />
          <ProjectCardContent>
            <ProjectCardTitle>Design System</ProjectCardTitle>
            <ProjectCardDescription>
              A comprehensive component library and design system adopted across
              multiple teams. Features 50+ components with full TypeScript
              support, accessibility, and dark mode.
            </ProjectCardDescription>
            <ProjectCardTags>
              <ProjectTag>React</ProjectTag>
              <ProjectTag>TypeScript</ProjectTag>
              <ProjectTag>Storybook</ProjectTag>
              <ProjectTag>Tailwind</ProjectTag>
            </ProjectCardTags>
            <ProjectCardActions>
              <ProjectLink href="#">
                <Code aria-hidden="true" />
                Code
              </ProjectLink>
              <ProjectLink href="#">
                <ExternalLink aria-hidden="true" />
                Live Demo
              </ProjectLink>
            </ProjectCardActions>
          </ProjectCardContent>
        </ProjectCard>
        <ProjectCard>
          <ProjectCardMedia className="bg-[linear-gradient(135deg,_rgba(248,113,113,0.2),_rgba(15,23,42,0.65))]" />
          <ProjectCardContent>
            <ProjectCardTitle>Real-time Collaboration Tool</ProjectCardTitle>
            <ProjectCardDescription>
              WebSocket-based collaboration platform enabling multiple users to
              work together in real-time. Built with operational transforms for
              conflict resolution.
            </ProjectCardDescription>
            <ProjectCardTags>
              <ProjectTag>React</ProjectTag>
              <ProjectTag>WebSocket</ProjectTag>
              <ProjectTag>Redis</ProjectTag>
              <ProjectTag>Node.js</ProjectTag>
            </ProjectCardTags>
            <ProjectCardActions>
              <ProjectLink href="#">
                <Code aria-hidden="true" />
                Code
              </ProjectLink>
              <ProjectLink href="#">
                <ExternalLink aria-hidden="true" />
                Live Demo
              </ProjectLink>
            </ProjectCardActions>
          </ProjectCardContent>
        </ProjectCard>
        <ProjectCard>
          <ProjectCardMedia className="bg-[linear-gradient(135deg,_rgba(96,165,250,0.2),_rgba(15,23,42,0.65))]" />
          <ProjectCardContent>
            <ProjectCardTitle>Analytics Dashboard</ProjectCardTitle>
            <ProjectCardDescription>
              Business intelligence dashboard processing millions of events per
              day. Features custom visualization library and real-time data
              streaming.
            </ProjectCardDescription>
            <ProjectCardTags>
              <ProjectTag>React</ProjectTag>
              <ProjectTag>D3.js</ProjectTag>
              <ProjectTag>Python</ProjectTag>
              <ProjectTag>BigQuery</ProjectTag>
            </ProjectCardTags>
            <ProjectCardActions>
              <ProjectLink href="#">
                <Code aria-hidden="true" />
                Code
              </ProjectLink>
              <ProjectLink href="#">
                <ExternalLink aria-hidden="true" />
                Live Demo
              </ProjectLink>
            </ProjectCardActions>
          </ProjectCardContent>
        </ProjectCard>
      </FeatureGrid>
    </section>
  );
}
