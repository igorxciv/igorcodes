"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

import { MobileNavLink } from "@/components/navigation/mobile-nav-link";
import { Button } from "@/components/ui/button";
import { MicroInteractionButton } from "@/components/ui/micro-interaction-button";
import { MicroInteractionLink } from "@/components/ui/micro-interaction-link";
import { useMobileMenu } from "@/hooks/navigation/use-mobile-menu";
import { useThemeToggleAnimation } from "@/hooks/theme/use-theme-toggle-animation";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";

type SiteHeaderProps = HTMLAttributes<HTMLElement>;

type HeaderNavProps = HTMLAttributes<HTMLElement>;

type HeaderNavLinkProps = ComponentPropsWithoutRef<typeof Link>;

type ThemeToggleButtonProps = ComponentPropsWithoutRef<"button">;

export function SiteHeader({ className, ...restProps }: SiteHeaderProps) {
  const { isOpen, closeMenu, toggleMenu } = useMobileMenu();

  return (
    <>
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
              &lt;/igorxciv&gt;
            </span>
          </div>
          <HeaderNav>
            <HeaderNavLink href="/" aria-label="Home">
              ./home
            </HeaderNavLink>
            <HeaderNavLink href="/about" aria-label="About">
              ./about
            </HeaderNavLink>
            <HeaderNavLink href="/resume" aria-label="Resume">
              ./resume
            </HeaderNavLink>
            <HeaderNavLink href="/projects" aria-label="Projects">
              ./projects
            </HeaderNavLink>
            <HeaderNavLink href="/blog" aria-label="Blog">
              ./blog
            </HeaderNavLink>
            <ThemeToggleButton />
          </HeaderNav>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggleButton />
            <MicroInteractionButton
              aria-label={isOpen ? "Close menu" : "Open menu"}
              size="icon"
              type="button"
              variant="outline"
              onClick={toggleMenu}
              className="text-base"
              preset="icon"
            >
              {isOpen ? (
                <X aria-hidden="true" className="size-4" />
              ) : (
                <Menu aria-hidden="true" className="size-4" />
              )}
            </MicroInteractionButton>
          </div>
        </div>
      </header>
      <MobileMenu isOpen={isOpen} closeMenu={closeMenu} />
    </>
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
  children,
  ...restProps
}: HeaderNavLinkProps) {
  return (
    <Button
      asChild
      className={cn(
        "px-2 text-[15px] font-medium transition-[color,background-color,border-color,box-shadow] duration-150",
        className,
      )}
      size="sm"
      variant="ghost"
    >
      <MicroInteractionLink preset="text" {...restProps}>
        {children}
      </MicroInteractionLink>
    </Button>
  );
}

export function ThemeToggleButton({
  className,
  type = "button",
  ...restProps
}: ThemeToggleButtonProps) {
  const { iconControls, toggleTheme } = useThemeToggleAnimation();

  return (
    <MicroInteractionButton
      aria-label="Toggle theme"
      className={cn("text-base", className)}
      onClick={toggleTheme}
      preset="icon"
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
    </MicroInteractionButton>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  closeMenu: () => void;
}

function MobileMenu({ isOpen, closeMenu }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          aria-label="Site navigation"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-stretch justify-end bg-black/30 backdrop-blur-sm md:hidden dark:bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={closeMenu}
        >
          <motion.div
            className="relative flex h-full w-72 flex-col gap-6 border-l border-zinc-200 bg-white/95 px-5 pt-6 text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-[#0b0b0c]/95 dark:text-zinc-100"
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">./menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={closeMenu}
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              <MobileNavLink href="/" active onClick={closeMenu}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/about" onClick={closeMenu}>
                About
              </MobileNavLink>
              <MobileNavLink href="/resume" onClick={closeMenu}>
                Resume
              </MobileNavLink>
              <MobileNavLink href="/projects" onClick={closeMenu}>
                Projects
              </MobileNavLink>
              <MobileNavLink href="/blog" onClick={closeMenu}>
                Blog
              </MobileNavLink>
            </nav>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
