# igorxciv

A Next.js 16 + React 19 personal site/portfolio with Home, About, Projects, Blog, and Resume pages, plus a job analyzer form UI.

**Features**

- App Router pages under `app/` with route-level metadata, loading/error, not-found, and status pages.
- Motion-based micro-interactions, animated mobile nav, and theme toggle.
- Light/dark mode via `next-themes`.
- Local fonts (Wotfard + Dank Mono) via `next/font/local`.
- shadcn/ui primitives + Radix UI, Tailwind CSS v4 tokens, and design system utilities.
- Job analyzer form module with text/link/PDF inputs (UI only; no backend yet).
- MDX blog with file-based posts, frontmatter metadata, and custom MDX components.

**Tech Stack**

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, tw-animate-css, clsx + tailwind-merge
- Motion for React (`motion`), lucide-react icons
- TanStack React Form + Zod (used in job analyzer feature)
- MDX via `@next/mdx` + `next-mdx-remote` + `gray-matter`

**Getting Started**

1. Install dependencies.

```bash
npm install
```

2. Start the dev server.

```bash
npm run dev
```

3. Build and run production.

```bash
npm run build
npm run start
```

**Scripts**

- `npm run dev` Start the dev server.
- `npm run build` Create a production build.
- `npm run start` Run the production build locally.
- `npm run lint` Run ESLint.
- `npm run format` Format with Prettier.
- `npm run format:check` Check formatting.

**Environment Variables**

- `NEXT_PUBLIC_SITE_URL` Base URL used for metadata, sitemap, and robots. Defaults to `https://example.com` if not set.

**Project Structure**

- `app/` App Router routes, global layout, metadata, sitemap/robots.
- `components/` Shared UI, layout, navigation, and page sections.
- `features/` Domain modules like `job-analyzer`.
- `hooks/` Reusable hooks (navigation, motion, theme).
- `lib/` Utilities and style helpers like `lib/styles/cn.ts`.
- `content/posts/` MDX blog posts (`YYYY/MM/DD/slug.mdx`).
- `public/` Static assets.

**Notes**

- Metadata images are referenced in `app/layout.tsx` (Open Graph/Twitter). Add assets under `public/` or update paths.
- MDX is wired in `next.config.ts` with `@next/mdx`, and MDX component mappings live in `mdx-components.tsx`.
- Draft posts (`published: false`) are available in development but excluded from production builds.
