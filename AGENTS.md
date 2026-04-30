<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Yuan Website — Agent Context

## Project Overview

Personal website of Yuan, a game developer. Built with Next.js 16 App Router + MongoDB + Tailwind CSS v4.

- **Tech Stack**: Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS v4, MongoDB (Mongoose)
- **Design System**: Windows 95 / 90s nostalgia retro aesthetic
- **Port**: 1111 (`npm run dev`)
- **Database**: MongoDB (default `mongodb://localhost:27018/yuan-website`)

## Architecture

```
app/
  (public)/          # Public-facing pages (route group, no URL prefix)
    page.tsx         # Homepage
    articles/page.tsx   # Articles list
    articles/[slug]/    # Article detail
    games/page.tsx   # Games list
  admin/             # Admin dashboard
    page.tsx         # Dashboard
    login/page.tsx   # Login
    articles/page.tsx   # Articles CRUD table
    articles/[id]/      # Article create/edit form
    games/page.tsx   # Games CRUD table
    games/[id]/      # Game create/edit form
  api/               # API routes
    auth/login/      # POST login
    articles/           # GET list, POST create
    articles/[slug]/    # GET, PUT, DELETE
    games/           # GET list, POST create
    games/[id]/      # GET, PUT, DELETE
    games/sync/      # POST sync from Itch.io API
components/
  win95/             # Win95 UI primitives
  public/            # Public page components
  admin/             # Admin components
lib/
  db.ts              # MongoDB connection (cached)
  auth.ts            # JWT utilities
models/
  Article.ts          # Article Mongoose schema
  Game.ts            # Game Mongoose schema
```

## Win95 Design System (STRICT)

This project uses an authentic Windows 95 aesthetic. **Every UI element must follow these rules:**

### Colors (NO gradients except title bar)
| Token | Value | Usage |
|-------|-------|-------|
| `win95-bg` | `#C0C0C0` | Button/surface backgrounds |
| `win95-text` | `#000000` | Primary text |
| `win95-gray` | `#808080` | Borders, secondary text |
| `win95-title` | `#000080` | Active title bar start |
| `win95-title-end` | `#1084D0` | Active title bar end |
| `win95-panel` | `#FFFFCC` | Light yellow panels |
| `win95-teal` | `#008080` | Desktop background |
| `win95-blue` | `#0000FF` | Links (unvisited) |
| `win95-red` | `#FF0000` | Link hover, emphasis |
| `win95-visited` | `#800080` | Visited links |

### Critical Rules
- **ZERO border-radius** anywhere. The 90s didn't have `border-radius`.
- **3D bevel effects** on every interactive element and container:
  - **Outset** (raised): `border-color: #fff #808080 #808080 #fff` + `box-shadow: inset -1px -1px 0 #404040, inset 1px 1px 0 #dfdfdf`
  - **Inset** (sunken): reverse the border colors
- **Active button state**: inset + `transform: translate(1px, 1px)`
- **Links**: always underlined, blue → red (hover) → purple (visited)
- **Headings**: Arial Black / Impact, bold or black weight only
- **No smooth transitions** on buttons (instant or 50ms max)

### Pre-built Components (USE THESE)
All UI must use components from `components/win95/`:
- `Win95Window` — Window card with title bar
- `Win95Button` — 3D button with variants: `default`, `primary`, `danger`, `success`
- `Win95Input` / `Win95Textarea` — Inset form inputs
- `Win95Marquee` — Scrolling text
- `RainbowText` — Animated rainbow heading text

**DO NOT** create custom styled divs when these components exist.

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4**, which differs significantly from v3:

- **NO `tailwind.config.js`** — Configuration is in CSS via `@theme inline`
- **Import**: `@import "tailwindcss";` in `globals.css`
- **Custom colors**: `--color-win95-bg: #C0C0C0;`
- **Custom fonts**: `--font-sans: "MS Sans Serif", ...;`
- **Custom animations**: `--animate-rainbow: rainbow 4s linear infinite;`

If you need to add new theme tokens, edit `app/globals.css` in the `@theme inline` block.

## Data Models

### Article
```typescript
{
  slug: string (unique, indexed),
  title: string,
  content: string,      // Markdown
  excerpt: string,
  date: Date,
  tags: string[],
  categories: string[],
  published: boolean,   // default true
  createdAt: Date,
  updatedAt: Date
}
```

### Game
```typescript
{
  title: string,
  description: string,
  imageUrl: string,     // Full URL or /images/... path
  itchUrl: string,      // Itch.io link
  tags: string[],
  order: number,        // Display order
  published: boolean,   // default true
  createdAt: Date,
  updatedAt: Date
}
```

## API Conventions

- All API routes return: `{ success: boolean, data?: T, error?: string }`
- **Public GET routes** do NOT require auth
- **POST / PUT / DELETE** require JWT token in `admin-token` cookie
- Auth is handled by `middleware.ts` (redirects unauthenticated users from `/admin/*` to `/admin/login`)

## Code Patterns

### Server Component with DB
```typescript
export const dynamic = "force-dynamic";  // Required for DB-dependent pages

import { connectDB } from "@/lib/db";
import Article from "@/models/Article";

async function getArticles() {
  await connectDB();
  const articles = await Article.find({ published: true }).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(articles));  // MUST serialize for client
}
```

### Chinese Slug Handling
Next.js App Router may pass URL-encoded or decoded slugs in `params`. Always use `decodeURIComponent()`:
```typescript
const slug = decodeURIComponent(rawSlug);
let article = await Article.findOne({ slug, published: true }).lean();
if (!article && slug !== rawSlug) {
  article = await Article.findOne({ slug: rawSlug, published: true }).lean();
}
```

### Client Component Form
```typescript
"use client";
// Use useState + fetch API directly
// No React Query / SWR installed
```

### Creating a New Page
1. Determine if it's public or admin
2. Public pages go in `app/(public)/` (affects `/` URL)
3. Admin pages go in `app/admin/`
4. If page fetches from DB, add `export const dynamic = "force-dynamic"`
5. Use `Win95Window` as the top-level container

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27018/yuan-website
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=change-me-in-production
```

## Common Commands

```bash
npm run dev        # Start dev server on :1111
npm run build      # Production build
npm start          # Start production server on :1111
npm run migrate    # Import markdown posts into MongoDB
```

## What NOT to Do

- Do NOT use `border-radius` anywhere
- Do NOT add smooth CSS transitions on buttons
- Do NOT remove link underlines
- Do NOT use thin font weights
- Do NOT create a separate `tailwind.config.js` (Tailwind v4 uses CSS config)
- Do NOT call `mongoose.connect()` directly — always use `connectDB()` from `lib/db.ts`
- Do NOT forget to serialize MongoDB objects with `JSON.parse(JSON.stringify(data))` before passing to client components
