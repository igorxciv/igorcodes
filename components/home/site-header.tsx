"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

type SiteHeaderProps = HTMLAttributes<HTMLElement>;

type HeaderNavProps = HTMLAttributes<HTMLElement>;

type HeaderNavLinkProps = ButtonHTMLAttributes<HTMLButtonElement>;

type ThemeToggleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SiteHeader({ className, ...restProps }: SiteHeaderProps) {
  return (
    <header
      className={cn("flex items-center justify-between", className)}
      {...restProps}
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-white">
        <span className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/5 px-4 font-mono text-xs tracking-wide">
          &lt;/dev&gt;
        </span>
      </div>
      <HeaderNav>
        <HeaderNavLink>Home</HeaderNavLink>
        <HeaderNavLink>About</HeaderNavLink>
        <HeaderNavLink>Resume</HeaderNavLink>
        <HeaderNavLink>Projects</HeaderNavLink>
        <HeaderNavLink>Blog</HeaderNavLink>
        <ThemeToggleButton />
      </HeaderNav>
    </header>
  );
}

export function HeaderNav({ className, ...restProps }: HeaderNavProps) {
  return (
    <nav
      className={cn(
        "hidden items-center gap-6 text-sm text-zinc-300 md:flex",
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
      className={cn("px-2 text-xs font-medium", className)}
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
  const { setTheme } = useTheme();

  return (
    <Button
      aria-label="Toggle theme"
      className={cn("text-base", className)}
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      }}
      size="icon"
      type={type}
      variant="outline"
      {...restProps}
    >
      <Sun aria-hidden="true" className="size-4 dark:hidden" />
      <Moon aria-hidden="true" className="hidden size-4 dark:inline" />
    </Button>
  );
}
