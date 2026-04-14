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

- **profiles**: id, email, password_hash, display_name, cert_agency, cert_number, cert_level, role (diver/pro/admin), pro_requested_at?
- **dive_sites**: id, name, slug, description, lat/long, country, region, difficulty, access_type, max_depth_m?, typical_visibility_m?, site_types[], created_by (pro only)
- **similarities**: id, site_a_id, site_b_id, created_by, pelagic/macro/landscape/currents/visibility ratings (1-5, all optional, min 1 required), note? (optional, 100 words max if provided). Duplicate comparisons (same user, same pair) are rejected.
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
    page.tsx                — Map explorer homepage (hero images + sim counts in popups)
    search/page.tsx         — Search/browse dive sites
    site/[slug]/page.tsx    — Site detail (nearby, similarities, images, JSON-LD)
    site/[slug]/similar/page.tsx — All comparisons for a site
    compare/page.tsx        — Comparison flow
    compare/[id]/page.tsx   — View a specific comparison (admin delete button)
    profile/page.tsx        — User profile + pro request
    admin/page.tsx          — Admin panel (pro requests, role management)
    auth/login/page.tsx     — Login
    auth/register/page.tsx  — 2-step registration (account + cert)
    pro/dashboard/page.tsx  — Pro's site management (edit buttons)
    pro/add-site/page.tsx   — Pin-on-map site creation
    pro/edit-site/[id]/page.tsx — Edit a dive site
    api/auth/[...nextauth]/route.ts
    api/auth/register/route.ts
    api/sites/route.ts      — GET all, POST create (pro)
    api/sites/[id]/route.ts — GET single, PATCH update
    api/sites/search/route.ts — Type-ahead search
    api/similarities/route.ts — POST create (deduped per user+pair)
    api/images/route.ts     — POST upload
    api/pro/request/route.ts — POST request pro status
    api/admin/approve-pro/route.ts
    api/admin/deny-pro/route.ts
    api/admin/set-role/route.ts
    api/admin/delete-similarity/route.ts
  components/
    layout/header.tsx       — Sticky nav (Admin Panel link for admins)
    layout/bottom-nav.tsx   — Mobile bottom nav (Explore/Search/Compare/Profile)
    layout/sw-register.tsx  — Service worker registration
    map/dive-map.tsx        — Mapbox globe (outdoors-v12, clusters, hero img popup)
    map/home-map.tsx        — Client wrapper for homepage
    map/pin-picker-map.tsx  — Click-to-place pin for site creation/editing
    sites/site-list.tsx     — Filtered+sorted list (nearest/recent/A-Z/most-compared)
    sites/site-detail-map.tsx — Mini map on detail page
    sites/similarity-card.tsx — Comparison display card
    sites/aggregated-scores.tsx — Averaged ratings across all comparisons
    sites/nearby-sites.tsx  — Auto-detected sites within 2km
    sites/site-images.tsx   — Image gallery + upload for sites
    sites/edit-site-form.tsx — Edit dive site form
    comparison/compare-flow.tsx — 2-step comparison wizard
    comparison/star-rating.tsx — 1-5 dot rating input
    comparison/site-search.tsx — Type-ahead site search dropdown
    comparison/comparison-images.tsx — Images on comparison detail page
    images/image-gallery.tsx — Horizontal scroll + lightbox
    images/image-upload.tsx — File picker + caption
    admin/admin-pro-requests.tsx — Approve/deny pro requests
    admin/admin-user-row.tsx — Inline role change per user
    admin/admin-delete-comparison.tsx — Admin delete with confirmation
    profile/pro-request-button.tsx — Request pro status
  db/
    schema.ts               — Drizzle schema (all 4 tables)
    index.ts                — DB client
  lib/
    auth.ts                 — NextAuth config + getProfile, requireAuth, requirePro
    auth-types.ts           — NextAuth type augmentations
    geo.ts                  — Haversine vicinity query (getNearbySites, 2km radius)
    slugify.ts              — URL slug generation
    utils.ts                — shadcn/ui cn() utility
  middleware.ts             — Protects /compare, /profile, /pro, /admin
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
