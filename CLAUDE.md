# Columbus

Dive site comparison PWA. The only platform answering: "What's a dive site similar to [X]?"

Full research and implementation plan: `plan.md`

## What This Is

A web-focused PWA for structured, subjective dive site comparison. Not a logbook, not a booking tool, not a social network. Divers compare two sites by rating similarity across 5 optional axes (pelagic, macro, landscape, currents, visibility) with a short note. Sites are curated by dive professionals only. All users must have a diving certification (PADI/SSI/NAUI/BSAC/CMAS/SDI/TDI/RAID) to sign up.

## Why It Exists

14 platforms researched (PADI App, MySSI, Deepblu, Zentacle, ScubaBoard, Diveboard, WannaDive, DiveSpot, Finstrokes, DiveMate, Scuba Advisor, Divezone, DiveAdvisor, DiveLife). None offer structured site-to-site comparison. The conversation "if you liked X, try Y because of the pelagics" happens daily in forums and WhatsApp groups but has no searchable, structured home.

## Tech Stack

- Next.js 16+ (App Router) / TypeScript / Tailwind CSS v4 / shadcn/ui v4 (base-ui primitives)
- PostgreSQL 16 (Docker, `postgres:16-alpine`) — no Supabase
- Drizzle ORM + postgres.js driver
- NextAuth v5 (credentials provider, JWT sessions, bcrypt password hashing)
- Mapbox GL JS (map/globe, geocoding)
- Docker Compose (postgres + app)

### Infrastructure

- **Database**: `docker compose up db` — PostgreSQL on port 5433 (5432 may conflict with system postgres)
- **Auth**: Self-hosted NextAuth with credentials provider. No third-party auth dependency.
- **Image storage**: Local filesystem / S3-compatible (future)
- **No Supabase**: Removed entirely due to IPv6-only direct connections and pooler issues

### shadcn/ui v4 Notes

Uses `@base-ui/react` primitives. Key differences from v3:
- No `asChild` prop — use `render` prop or pass className directly to the primitive
- `Select.onValueChange` passes `string | null`, not `string`
- `useSearchParams()` must be in a Suspense boundary for static generation

## Data Model (4 entities)

- **profiles**: id, email, password_hash, display_name, cert_agency, cert_number, cert_level, role (diver/pro/admin)
- **dive_sites**: id, name, slug, description, lat/long, country, region, difficulty, access_type, site_types[], created_by (pro only)
- **similarities**: id, site_a_id, site_b_id, created_by, pelagic/macro/landscape/currents/visibility ratings (1-5, all optional, min 1), note (100 words max)
- **images**: id, url, thumbnail_url, uploaded_by, dive_site_id?, similarity_id?, caption

Schema: `src/db/schema.ts`

## User Roles

- **Diver**: browse, search, compare, upload images
- **Pro**: all diver actions + create/edit dive sites (only way sites enter the system)
- **Admin**: moderate content, approve pro status

## UX Rules (non-negotiable)

1. Progressive disclosure — never show all fields at once
2. Max 7 primary actions per screen (Miller's Law)
3. All 5 similarity axes are optional (min 1) — don't force ratings on dimensions the diver didn't notice
4. Recognition over recall — autocomplete search, not manual coordinate entry
5. Single primary action per screen
6. Mobile-first, thumb-friendly zones
7. Clean whitespace, card-based layout, blue-dominant palette (restrained, not dark tactical)
8. Map as home screen — visual exploration first

## Anti-Patterns (do NOT do these)

- Feature creep: no logbook, no training, no booking, no marketplace, no job board
- Social feeds: comparisons are permanent searchable entities, not timeline posts
- Generic star ratings: always use the 5 specific axes
- Carousel navigation for lists: use list/grid; carousels only for single-site image galleries
- Ecosystem lock-in: must work for any cert agency
- Aggressive data collection: cert number + email, nothing more

## Project Structure

```
src/
  app/
    page.tsx                — Map explorer homepage
    search/page.tsx         — Search/browse dive sites
    site/[slug]/page.tsx    — Dive site detail with similarities
    compare/page.tsx        — Comparison flow (site picker + rating)
    compare/[id]/page.tsx   — View a specific comparison
    auth/login/page.tsx     — Login
    auth/register/page.tsx  — 2-step registration (account + cert)
    api/auth/[...nextauth]/route.ts — NextAuth handler
    api/auth/register/route.ts — Registration endpoint
    pro/dashboard/page.tsx  — Pro's site management
    pro/add-site/page.tsx   — Pin-on-map site creation
    api/sites/route.ts      — Sites CRUD API
    api/sites/search/route.ts — Site search (ilike on name/country/region)
    api/similarities/route.ts — Create similarity comparison
  components/
    layout/header.tsx       — Sticky nav with auth state
    map/dive-map.tsx        — Mapbox globe with clusters
    map/home-map.tsx        — Client wrapper for homepage
    map/pin-picker-map.tsx  — Click-to-place pin for site creation
    sites/site-list.tsx     — Filtered site list
    sites/site-detail-map.tsx — Mini map on detail page
    sites/similarity-card.tsx — Comparison display card
    sites/aggregated-scores.tsx — Averaged ratings across all comparisons
    comparison/compare-flow.tsx — 2-step comparison wizard
    comparison/star-rating.tsx — 1-5 dot rating input
    comparison/site-search.tsx — Type-ahead site search dropdown
  db/
    schema.ts               — Drizzle schema (all 4 tables)
    index.ts                — DB client
  lib/
    auth.ts                 — NextAuth config + getProfile, requireAuth, requirePro
    auth-types.ts           — NextAuth type augmentations
    slugify.ts              — URL slug generation
    utils.ts                — shadcn/ui cn() utility
  middleware.ts             — Route middleware
```

## Page Routes

```
/                       — Map explorer (home)
/search                 — Search results + filters
/site/[slug]            — Dive site detail
/compare                — Start a new comparison (Phase 2)
/compare/[id]           — View a specific similarity (Phase 2)
/profile                — User profile (Phase 4)
/pro/dashboard          — Pro: manage their sites
/pro/add-site           — Pro: add new dive site
/auth/login             — Login
/auth/register          — Registration
/admin                  — Admin panel (Phase 4)
```

## Development Phases

### Phase 1: Foundation (MVP) <-- CURRENT
- [x] Next.js + TypeScript + Tailwind + shadcn/ui setup
- [x] Drizzle schema (PostGIS-ready, all 4 tables with indexes)
- [x] NextAuth v5 (credentials + JWT, cert-gated registration)
- [x] Docker Compose (PostgreSQL 16 on port 5433)
- [x] Schema pushed to local DB (all 4 tables)
- [x] Mapbox globe with clustered site pins
- [x] Dive site CRUD (pro only, with API + map pin + geocoding)
- [x] Site detail page with similarity display
- [x] Search page with client-side filtering
- [x] Header with auth state + navigation
- [x] Dev server running (http://localhost:3000)

### Phase 2: Comparison Engine <-- DONE
- [x] Similarity creation flow (3-step: select sites, rate 5 axes, submit with note)
- [x] Similarity detail page (/compare/[id]) with rating bars
- [x] Aggregated scores component on site detail page
- [x] Site search API with type-ahead (/api/sites/search?q=)
- [x] Filtering (difficulty, access type, site type) on search page
- [x] Similarities API with validation (min 1 rating, 100 word max, sites exist)

### Phase 3: Images & PWA <-- DONE
- [x] Image upload API (local filesystem, 5MB max, JPEG/PNG/WebP)
- [x] Image gallery component (horizontal scroll, lightbox on click)
- [x] Upload + gallery on site detail pages (live refresh)
- [x] PWA manifest + service worker (network-first HTML, cache-first assets)
- [x] Apple web app meta tags
- [x] Mobile bottom nav (Explore/Search/Compare/Profile)
- [x] Safe area padding, responsive bottom spacing

### Phase 4: Discovery
- [x] User profiles (/profile — comparisons list + pro request button)
- [x] Pro verification workflow (request on profile page, admin panel at /admin approve/deny)
- [x] SEO: generateMetadata on /site/[slug] with og:title, description, canonical URL + JSON-LD TouristAttraction
- [x] /site/[slug]/similar — dedicated overflow page for all comparisons (site detail shows first 5 + "View all")
- [x] Edit dive site (/pro/edit-site/[id]) — pros edit own sites, admins edit any; pencil icon on dashboard
- [x] Photos on comparison detail page (/compare/[id]) — any logged-in user can add photos
- [x] Sort on search page — most compared / recently added / name A-Z
- [x] has-images filter on search page
- [x] Similarity + image counts shown in site list cards and map popups
- [x] typical_visibility_m field — schema, add-site form, edit-site form, site detail badges
- [x] Admin: inline role change dropdown per user (diver/pro/admin); admins cannot change own role

### Phase 5: Future
- [ ] Offline queued submissions
- [ ] Seasonal metadata on sites
- [ ] Marine life tagging
- [ ] Advanced filtered search
- [ ] Natural language search

## Commands

```bash
# Start database
docker compose up db -d

# Push schema (first time or after changes)
npx drizzle-kit push

# Dev server
npm run dev

# Build / lint
npm run build
npm run lint

# Database teardown
docker compose down      # Stop (keep data)
docker compose down -v   # Stop + delete data
```

## Environment Variables (.env.local)

```
DATABASE_URL=postgresql://columbus:columbus_dev@localhost:5433/columbus
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production-at-least-32-chars!
AUTH_TRUST_HOST=true
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```
