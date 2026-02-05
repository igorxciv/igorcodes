import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import type { PostContent, PostFrontmatter } from "@/lib/types/posts";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const mdxFilePattern = /\.mdx?$/;

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date format",
  });

const stringArray = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}, z.array(z.string()));

const postFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: dateString,
  updated: dateString.optional(),
  topics: stringArray,
  tags: stringArray,
  published: z.boolean().default(true),
  featured: z.boolean().optional(),
  readingTime: z.number().int().positive().optional(),
  coverImage: z.string().optional(),
  coverAlt: z.string().optional(),
});

interface PostOptions {
  includeDrafts?: boolean;
}

const getPostFiles = async (directory = postsDirectory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return getPostFiles(fullPath);
      }
      if (entry.isFile() && mdxFilePattern.test(entry.name)) {
        return [fullPath];
      }
      return [];
    }),
  );
  return files.flat();
};

const getSlugFromPath = (filePath: string) =>
  path
    .relative(postsDirectory, filePath)
    .replace(/\\/g, "/")
    .replace(mdxFilePattern, "");

const readPostFile = async (filePath: string): Promise<PostContent> => {
  const source = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(source);
  const parsed = postFrontmatterSchema.safeParse(data);

  if (!parsed.success) {
    const slug = getSlugFromPath(filePath);
    throw new Error(
      `Invalid frontmatter for ${slug}: ${parsed.error.flatten().fieldErrors}`,
    );
  }

  const frontmatter = parsed.data as PostFrontmatter;

  return {
    ...frontmatter,
    slug: getSlugFromPath(filePath),
    body: content.trim(),
  };
};

const isProduction = () => process.env.NODE_ENV === "production";

export const getAllPosts = async (options: PostOptions = {}) => {
  const includeDrafts = options.includeDrafts ?? !isProduction();
  const files = await getPostFiles();
  const posts = await Promise.all(files.map((file) => readPostFile(file)));

  return posts
    .filter((post) => (includeDrafts ? true : post.published))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .map((post) => {
      const { body, ...summary } = post;
      void body;
      return summary;
    });
};

export const getPostBySlug = async (
  slug: string,
  options: PostOptions = {},
) => {
  const includeDrafts = options.includeDrafts ?? !isProduction();
  const files = await getPostFiles();
  const matched = files.find((file) => getSlugFromPath(file) === slug);

  if (!matched) {
    return null;
  }

  const post = await readPostFile(matched);
  if (!includeDrafts && !post.published) {
    return null;
  }

  return post;
};

export const getAllTags = async (options: PostOptions = {}) => {
  const posts = await getAllPosts(options);
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort();
};

export const getAllTopics = async (options: PostOptions = {}) => {
  const posts = await getAllPosts(options);
  return Array.from(new Set(posts.flatMap((post) => post.topics))).sort();
};
