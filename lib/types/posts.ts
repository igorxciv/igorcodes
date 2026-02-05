export interface PostFrontmatter {
  title: string;
  description?: string;
  date: string;
  updated?: string;
  topics: string[];
  tags: string[];
  published: boolean;
  featured?: boolean;
  readingTime?: number;
  coverImage?: string;
  coverAlt?: string;
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
}

export interface PostContent extends PostSummary {
  body: string;
}
