import Image from "next/image";
import Link from "next/link";

import { MdxCallout } from "@/components/mdx/mdx-callout";
import { cn } from "@/lib/styles/cn";

import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";

type AnchorProps = ComponentPropsWithoutRef<"a">;
type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type ListProps = ComponentPropsWithoutRef<"ul">;
type ListItemProps = ComponentPropsWithoutRef<"li">;
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;
type PreProps = ComponentPropsWithoutRef<"pre">;
type CodeProps = ComponentPropsWithoutRef<"code">;
type TableProps = ComponentPropsWithoutRef<"table">;
type ImageProps = ComponentPropsWithoutRef<typeof Image> & {
  width?: number;
  height?: number;
  fill?: boolean;
};

const headingClasses =
  "font-semibold tracking-tight text-zinc-900 dark:text-white";
const bodyClasses = "text-zinc-700 dark:text-zinc-300";

function MdxLink({ href = "", className, ...props }: AnchorProps) {
  const isExternal =
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");
  const linkClasses = cn(
    "font-medium text-zinc-900 underline decoration-zinc-300/70 underline-offset-4 transition-colors hover:text-black dark:text-white dark:decoration-zinc-500/60 dark:hover:text-white",
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClasses}
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    );
  }

  return <Link href={href} className={linkClasses} {...props} />;
}

function MdxImage({
  className,
  alt = "",
  width,
  height,
  fill,
  ...props
}: ImageProps) {
  const sharedClass = cn("rounded-2xl border border-zinc-200/70", className);

  if (fill || (typeof width === "number" && typeof height === "number")) {
    return (
      <Image
        alt={alt}
        className={sharedClass}
        width={width}
        height={height}
        fill={fill}
        sizes={props.sizes ?? "100vw"}
        {...props}
      />
    );
  }

  return <img alt={alt} className={sharedClass} {...props} />;
}

export const mdxComponents: MDXComponents = {
  h1: ({ className, ...props }: HeadingProps) => (
    <h1
      className={cn(headingClasses, "text-3xl sm:text-4xl", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }: HeadingProps) => (
    <h2
      className={cn(headingClasses, "mt-10 text-2xl sm:text-3xl", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: HeadingProps) => (
    <h3
      className={cn(headingClasses, "mt-8 text-xl sm:text-2xl", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: ParagraphProps) => (
    <p
      className={cn(bodyClasses, "text-base leading-7", className)}
      {...props}
    />
  ),
  a: MdxLink,
  ul: ({ className, ...props }: ListProps) => (
    <ul
      className={cn(
        bodyClasses,
        "ml-6 list-disc space-y-2 text-base leading-7",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: ListProps) => (
    <ol
      className={cn(
        bodyClasses,
        "ml-6 list-decimal space-y-2 text-base leading-7",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: ListItemProps) => (
    <li className={cn("pl-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: BlockquoteProps) => (
    <blockquote
      className={cn(
        "border-l-2 border-emerald-300/70 pl-4 text-base text-zinc-700 dark:text-zinc-300",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: PreProps) => (
    <pre
      className={cn(
        "overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-sm text-zinc-100",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: CodeProps) => {
    const isBlock = className?.includes("language-");
    return (
      <code
        className={cn(
          isBlock
            ? "font-mono text-[0.9em] text-zinc-100"
            : "rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-900 dark:bg-white/10 dark:text-zinc-100",
          className,
        )}
        {...props}
      />
    );
  },
  table: ({ className, ...props }: TableProps) => (
    <table
      className={cn(
        "w-full border-collapse text-left text-sm text-zinc-700 dark:text-zinc-300",
        className,
      )}
      {...props}
    />
  ),
  Callout: MdxCallout,
  img: MdxImage,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}
