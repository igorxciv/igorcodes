import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { SiteHeader, SiteShell } from "@/components/layout";
import { formatDate } from "@/lib/formatters/date";
import { getAllPosts, getPostBySlug } from "@/lib/server/posts";
import { mdxComponents } from "@/mdx-components";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

const includeDrafts = process.env.NODE_ENV !== "production";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts({ includeDrafts });
  return posts.map((post) => ({
    slug: post.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug.join("/"), { includeDrafts });

  if (!post) {
    return {};
  }

  const title = post.title;
  const description = post.description ?? "Blog post";
  const canonical = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug.join("/"), { includeDrafts });

  if (!post) {
    notFound();
  }

  return (
    <SiteShell>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 pt-10 pb-20 sm:px-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.28em] text-zinc-500 uppercase dark:text-zinc-400">
            <span>{formatDate(post.date)}</span>
            {post.updated ? (
              <span>Updated {formatDate(post.updated)}</span>
            ) : null}
            {post.readingTime ? <span>{post.readingTime} min read</span> : null}
            {!post.published && includeDrafts ? <span>Draft</span> : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {post.title}
          </h1>
          {post.description ? (
            <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {post.description}
            </p>
          ) : null}
          {(post.topics.length > 0 || post.tags.length > 0) && (
            <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {post.topics.map((topic) => (
                <span
                  key={`topic-${topic}`}
                  className="rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                >
                  {topic}
                </span>
              ))}
              {post.tags.map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className="rounded-full border border-zinc-200/70 bg-white/80 px-2.5 py-1 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
        <article className="mt-10 space-y-6">
          <MDXRemote source={post.body} components={mdxComponents} />
        </article>
      </main>
    </SiteShell>
  );
}
