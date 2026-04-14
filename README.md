# Columbus

**The subjective comparison engine for dive sites worldwide.**

> *"What's a dive site similar to [X]?"*

Columbus is the only platform that answers this question in a structured, searchable way. Divers compare two sites by rating similarity across five optional axes — pelagic life, macro life, landscape, currents, and visibility — with a short note. The conversation that happens daily in ScubaBoard threads and WhatsApp groups finally has a permanent, searchable home.

---

## What it is

A web-focused PWA for structured dive site comparison. Not a logbook, not a booking tool, not a social network.

- **Sites** are curated by verified dive professionals only
- **Comparisons** are permanent, searchable entities — not timeline posts
- **Ratings** use 5 specific axes that map to how divers actually think, not generic stars
- **Auth** is gated by diving certification (PADI/SSI/NAUI/BSAC/CMAS/SDI/TDI/RAID)

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Database | PostgreSQL 16 (Docker) |
| ORM | Drizzle ORM + postgres.js |
| Auth | NextAuth v5 (credentials, JWT) |
| Maps | Mapbox GL JS |
| Images | sharp (WebP processing) |
| PWA | Service worker (network-first HTML, cache-first assets) |

## Getting started

### Prerequisites

- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/columbus.git
cd columbus
npm install

# 2. Environment
cp .env.example .env.local
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_MAPBOX_TOKEN

# 3. Start the database
docker compose up db -d

# 4. Push schema
npx drizzle-kit push

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```env
DATABASE_URL=postgresql://columbus:columbus_dev@localhost:5433/columbus
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-at-least-32-chars
AUTH_TRUST_HOST=true
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

## Features

### Core
- **Mapbox globe** — clustered dive site pins, popup with hero image, similarity count, and "Would you dive here again?" rating with inline voting
- **Comparison engine** — 3-step wizard: pick two sites, rate up to 5 similarity axes (all optional, min 1), add a note
- **Aggregated scores** — per-axis averages across all comparisons on a site detail page
- **Ranked similar sites** — `/site/[slug]/similar` shows all comparisons sorted by overall similarity score
- **Search & filter** — type-ahead search, filter by difficulty/access/type/has-images, sort by most compared/recent/A-Z/nearest

### Content & social
- **"Would you dive here again?"** — thumbs up/down rating per site; shows aggregate % + progress bar; votable from map popup or site detail page
- **Image galleries** — upload photos to sites and comparisons; lightbox viewer; sharp-processed WebP thumbnails
- **Edit history** — comparisons track every edit with a collapsible pre-edit snapshot timeline
- **Description suggestions** — members can propose description edits; admins approve/reject

### User roles
| Role | Capabilities |
|------|-------------|
| **Diver** | Browse, search, compare, upload images, rate sites |
| **Pro** | All diver actions + create/edit dive sites |
| **Admin** | All pro actions + approve pro requests, manage roles, moderate content |

### PWA
- Installable on iOS and Android
- Service worker with network-first HTML and cache-first asset strategies
- Mobile bottom nav with safe area padding

## Data model

```
profiles          — users with cert verification
dive_sites        — pro-curated site entries
similarities      — the core comparison entity (5 axes, note)
similarity_history — pre-edit snapshots for edit audit trail
images            — photos attached to sites or comparisons
site_ratings      — "would dive again" boolean votes per user+site
site_description_suggestions — member-proposed description edits
```

## Project structure

```
src/
  app/               — Next.js App Router pages and API routes
  components/
    layout/          — Header, bottom nav, service worker registration
    map/             — Mapbox globe, home map wrapper, pin picker
    sites/           — Site list, detail map, similarity cards, ratings
    comparison/      — Compare flow, star rating, site search, edit/history
    images/          — Gallery and upload components
    admin/           — Pro request review, role management, moderation
    profile/         — Pro request button
  db/
    schema.ts        — Drizzle schema (all 7 tables)
    index.ts         — DB client with HMR-safe singleton
  lib/
    auth.ts          — NextAuth config, getProfile, requireAuth, requirePro
    geo.ts           — Haversine nearby site detection (2km radius)
    slugify.ts       — URL slug generation
```

## Commands

```bash
docker compose up db -d      # Start database
npx drizzle-kit push         # Push schema changes
npm run dev                  # Dev server (http://localhost:3000)
npm run build                # Production build
npm run lint                 # Lint
docker compose down          # Stop (keep data)
docker compose down -v       # Stop and delete data
```

---

Built with [Next.js](https://nextjs.org), [Drizzle ORM](https://orm.drizzle.team), [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/), and [shadcn/ui](https://ui.shadcn.com).
