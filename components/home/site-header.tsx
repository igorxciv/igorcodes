"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useThemeToggleAnimation } from "@/hooks/theme/use-theme-toggle-animation";
import { cn } from "@/lib/styles/cn";

import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

type SiteHeaderProps = HTMLAttributes<HTMLElement>;

type HeaderNavProps = HTMLAttributes<HTMLElement>;

type HeaderNavLinkProps = ButtonHTMLAttributes<HTMLButtonElement>;

type ThemeToggleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SiteHeader({ className, ...restProps }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/70 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0b0b0c]/30 dark:shadow-none",
        className,
      )}
      {...restProps}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-white">
          <span className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-zinc-100 px-4 font-mono text-xs tracking-wide text-zinc-700 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200">
            &lt;/dev&gt;
          </span>
        </div>
        <HeaderNav>
          <HeaderNavLink aria-label="Home">./home</HeaderNavLink>
          <HeaderNavLink aria-label="About">./about</HeaderNavLink>
          <HeaderNavLink aria-label="Resume">./resume</HeaderNavLink>
          <HeaderNavLink aria-label="Projects">./projects</HeaderNavLink>
          <HeaderNavLink aria-label="Blog">./blog</HeaderNavLink>
          <ThemeToggleButton />
        </HeaderNav>
      </div>
    </header>
  );
}

export function HeaderNav({ className, ...restProps }: HeaderNavProps) {
  return (
    <nav
      className={cn(
        "hidden items-center gap-6 text-[15px] font-medium text-zinc-600 md:flex dark:text-zinc-300",
        className,
      )}
      {...restProps}
    />
  );
}

export function HeaderNavLink({
  className,
  type = "button",
  ...restProps
}: HeaderNavLinkProps) {
  return (
    <Button
      className={cn("px-2 text-[15px] font-medium", className)}
      size="sm"
      type={type}
      variant="ghost"
      {...restProps}
    />
  );
}

export function ThemeToggleButton({
  className,
  type = "button",
  ...restProps
}: ThemeToggleButtonProps) {
  const { iconControls, toggleTheme } = useThemeToggleAnimation();

  return (
    <Button
      aria-label="Toggle theme"
      className={cn("text-base", className)}
      onClick={toggleTheme}
      size="icon"
      type={type}
      variant="outline"
      {...restProps}
    >
      <motion.span
        aria-hidden="true"
        className="relative inline-flex h-4 w-4 items-center justify-center"
        animate={iconControls}
      >
        <Sun className="absolute inset-0 size-4 opacity-100 transition-opacity duration-150 dark:opacity-0" />
        <Moon className="absolute inset-0 size-4 opacity-0 transition-opacity duration-150 dark:opacity-100" />
      </motion.span>
    </Button>
  );
}
