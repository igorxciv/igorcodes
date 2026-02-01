# Repository Guidelines

## Project Structure (Root App Router)
- `app/`: Next.js App Router (pages, layouts, route handlers).
- `app/(site)/`: Marketing/site routes and blog pages (route group).
- `app/(dashboard)/`: Authenticated app routes (route group).
- `app/api/`: API route handlers (`route.ts`).
- `components/`: Shared UI components.
  - `ui/` (shadcn/ui primitives), `layout/`, `forms/`, `modals/`, `icons/`.
- `content/`: Static MDX content (e.g., `posts/`), if not colocated in `app/`.
- `lib/`: Utilities and helpers; `lib/server/` for server-only code.
- `hooks/`: Reusable React hooks.
- `features/`: Optional feature modules (domain-first grouping).
- `styles/`: Extra global styles or theme files (if needed).
- `public/`: Static assets served as-is (must stay at repo root).
- Config at repo root (e.g., `next.config.*`, `tsconfig.json`, `tailwind.config.*`, `eslint.config.*`, `postcss.config.*`).

## Default File Placement (When Creating New Files)
- Pages/layouts/route handlers: `app/**`.
- Blog MDX pages: `app/(site)/blog/[slug]/page.mdx` or `content/posts/*.mdx`.
- Shared UI components: `components/**` (use subfolders above).
- Non-UI logic: `lib/**` (server-only in `lib/server/**`).
- Reusable hooks: `hooks/**`.
- Feature-specific code: `features/<feature>/**`.
- Static assets: `public/**`.
  - MDX setup uses `@next/mdx` + `@mdx-js/loader` + `@mdx-js/react` and requires `mdx-components.tsx` at repo root (same level as `app/`).
  - Prefer `mdx-components.tsx` for component mapping; do not use `MDXProvider` unless explicitly required.
  - Static metadata (e.g., `robots.txt`, `favicon.ico`) should use `app/` metadata files, not `public/`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server at `http://localhost:3000`.
- `npm run build`: Create a production build in `.next/`.
- `npm run start`: Run the production build locally (requires `npm run build`).
- `npm run lint`: Run ESLint with Next.js and TypeScript rules.
 - MDX is configured via `next.config.mjs` with `@next/mdx` and `pageExtensions` including `mdx`.

## Coding Style & Naming
- TypeScript + React (Next.js App Router).
- 2-space indentation in JS/TS/JSON.
- Components in `PascalCase`, hooks in `useCamelCase`, files in `kebab-case` or `camelCase` to match nearby patterns.

## Testing
- No testing framework configured yet.
- If you add tests, document the framework and command here and co-locate tests or use `tests/`.

## Boundaries
- Always: create new source files under `app/`, `components/`, `lib/`, etc. (not at repo root).
- Ask first: reorganizing top-level folders or moving existing app routes.
- Never: commit secrets or build outputs (`.next/`, `.env.local`).
