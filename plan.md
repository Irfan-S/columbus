# Columbus — Dive Site Comparison Platform

## Context

No existing dive platform lets divers say "Site X is like Site Y because of [specific attributes]" in a structured way. Current platforms focus on logging, training, reviews, or social feeds — but all suffer from UX information overload and none solve the subjective comparison problem. Columbus fills that gap with a clean, cognitively lightweight PWA focused entirely on structured dive site comparison.

---

## 1. Market Analysis

### 1.1 Platform-by-Platform Deep Dive

#### PADI App (MyPADI, formerly ScubaEarth)
- **What it does**: Digital logbook, certification management, dive site locator (50K+ sites), eLearning, dive shop finder, weather/tide data at sites
- **Strengths**: Largest brand recognition. Weather/tide integration at dive sites is genuinely useful. QR code verification by pros for logged dives
- **Weaknesses**: A UX case study found 60% of users want improvements. The core problem identified was a disconnect between documentation (logging) and exploration (discovery) — divers want to research marine life and spectacular views at different locations, but the app treats discovery as an afterthought. No Bluetooth dive computer sync. The dive site locator is weaker than SSI's
- **Lesson for Columbus**: PADI proved that divers crave discovery/exploration features, not just logging. Their weather/tide data integration is smart context. But they tried to be everything (training + logging + shop finder + booking) and diluted each feature. Columbus should take the discovery insight but stay laser-focused on comparison

#### MySSI App
- **What it does**: Training platform, logbook with 65K+ dive sites (GPS coordinates), wildlife list, buddy list, Bluetooth sync with Mares/Scubapro dive computers
- **Strengths**: Best dive site database with precise GPS coordinates. Comprehensive wildlife identification list. Bluetooth sync is a real differentiator for logging accuracy
- **Weaknesses**: Locked to SSI ecosystem — you need SSI certification to get full value. Feature-heavy interface. Training is the primary focus, sites are secondary
- **Lesson for Columbus**: SSI's 65K site database with GPS coords shows the scale that's possible. Their wildlife list (species identification tied to sites) is an interesting data angle we should note for future phases. But the ecosystem lock-in is an anti-pattern — Columbus must be agency-agnostic from day one

#### Deepblu
- **What it does**: Social network for divers + dive computer (COSMIQ). Logs enriched with photos/video mapped to depth profiles. "Planet Deepblu" interactive map of 10K+ sites. Community groups ("Macro Freaks", "Nudibranch Junkies"). Feed with Live/Featured/Following tabs
- **Strengths**: The depth-profile photo mapping is genuinely innovative — photos are placed at the exact depth and time they were taken, creating an immersive dive narrative. The three-tab feed (Live/Featured/Following) balances algorithmic curation with social filtering well. Community groups for niche interests (macro, wrecks, freediving) show divers want to self-organize around specific interests
- **Weaknesses**: Trying to be "Instagram for divers" means social feed noise. Business features (bookings, dive shop management) bloat the product. The social feed model means content is ephemeral — good dive site knowledge gets buried in the timeline
- **Lesson for Columbus**: The niche community groups validate that divers think in categories (macro vs pelagic vs wrecks) — exactly the axes Columbus uses for comparison. But social feeds are the wrong container for persistent knowledge. Columbus should make comparisons permanent, searchable artifacts — not timeline posts that scroll away. The depth-profile photo idea is brilliant but out of scope — note for future

#### Zentacle (formerly ShoreDiving.com)
- **What it does**: Dive/snorkel site reviews with maps and photos. Sites organized geographically (country → region → site). Each site has: hero image, difficulty level (beginner/intermediate/advanced), max depth, access type (shore/boat), aggregate star rating, review count, visibility rating, nearby dive shops, tide data
- **Strengths**: Clean visual design with generous whitespace and hero photography — closest to Columbus's aesthetic goals. Geographic hierarchy is intuitive. Difficulty rating is simple and useful. The "recently updated conditions" section shows fresh data matters. Nearby dive shop integration is practical. Reef-safe sunscreen messaging shows values alignment with divers
- **Weaknesses**: Many sites have zero reviews and placeholder images — the cold start problem is real. Review system is generic (star rating + text) with no structured categories. Broad scope (snorkel + scuba + beaches) dilutes focus. Site cards in carousels are less efficient than lists for serious researchers
- **Lesson for Columbus**: Zentacle's clean card-based design with hero images is the right visual language. Their difficulty level field is worth adopting for dive sites. The cold-start problem (many sites with 0 reviews) is a warning — Columbus needs to ensure sites have value even before comparisons exist (the pro-curated site data provides baseline value). Carousel navigation is inferior to list/grid for power users who want to scan many sites

#### Divezone
- **What it does**: Community-driven diving blog + review platform + liveaboard marketplace + job portal. Destinations organized by region with user ratings on "dive rating" and "sea life" (1-5 scales). Instagram embeds, social sharing
- **Strengths**: Geographic organization works. The combination of editorial blog content with structured destination pages creates good context. Liveaboard marketplace is a strong monetization path
- **Weaknesses**: Rating system lacks granularity — just "dive rating" and "sea life" are too vague. No date/verified filtering on reviews erodes trust. Navigation menus are extensive and overwhelming. Job portal and marketplace clutter the core experience
- **Lesson for Columbus**: Simple 1-5 scales work for input (low friction), but the categories need to be meaningful and specific. "Dive rating" is too generic — Columbus's five axes (pelagic, macro, landscape, currents, visibility) are the right level of specificity. Also reinforces the anti-pattern of feature creep (blog + marketplace + jobs + reviews)

#### Diveboard
- **What it does**: Social dive logging with 65K+ sites, certification storage, diver-to-diver messaging, photo galleries, community blog
- **Strengths**: Beautiful dive profiles with rich detail options. Active community blog with engaged contributors. Early mover advantage in online dive logging
- **Weaknesses**: Aging interface with dated design patterns. Import functionality has gaps (imported dives lose location details). GPS/mapping tools are weak. Platform feels stagnant — limited development momentum
- **Lesson for Columbus**: Diveboard shows that community engagement around specific dive content can work, but the platform needs active development to stay relevant. The import gaps highlight the importance of data quality at entry — Columbus's pro-curation model avoids this by ensuring sites are entered correctly from the start

#### WannaDive
- **What it does**: World dive site atlas as a moderated wiki. Sites organized hierarchically (continent → country → zone → site). OpenLayers map with multiple tile layers. GPS/KML data exports. Seasonal guides with air/water temperature by month. User comments, dive logs, trip reports, photo galleries
- **Strengths**: The wiki model means data is community-maintained and corrections happen. Seasonal guides (temperature by month, recommended equipment) are genuinely useful trip-planning data. KML/GPS data exports for personal use show respect for user data. Hierarchical geographic organization scales well globally
- **Weaknesses**: Flash-era UI, dated CSS, JavaScript-dependent features that break in modern browsers. Wiki editing friction keeps contributors low. Content varies wildly by region (some zones have rich data, others are empty)
- **Lesson for Columbus**: WannaDive's seasonal data (temperatures by month, equipment recommendations) is the kind of context that makes a site page genuinely useful for trip planning — consider adding seasonal metadata to dive sites in a future phase. Their geographic hierarchy (continent → country → region) is proven UX for global navigation. But the wiki model is too slow for Columbus — pro-curation is faster and higher quality

#### DiveSpot
- **What it does**: Interactive map of 20K+ dive sites. AI-enhanced dive logging. Natural language search ("find dive sites with whale sharks in warm water"). Filters by dive type, depth, experience level, marine life. Favorite saving and sharing
- **Strengths**: Natural language search is a modern differentiator. 20K+ sites is a solid database. Filtering by marine life type aligns with how divers think about sites
- **Weaknesses**: Relatively new — community and content depth is still building. AI features may feel gimmicky without enough underlying data
- **Lesson for Columbus**: Natural language search is worth noting for a future phase. Their marine life filtering validates that divers want to find sites by what they'll see (pelagic, macro, etc.) — directly supports Columbus's comparison axes

#### Finstrokes
- **What it does**: UK-focused dive site guides with extremely detailed per-site information: exact location, max depth, dive type, tides, experience level, underwater directions, hazards, parking, mobile network coverage, nearest pub, nearest air fill station
- **Strengths**: The gold standard for single-site information density — every practical detail a diver needs is there. Underwater maps/photos, surface photos, site maps. Hazard warnings are a safety feature no other platform does well. Related site recommendations ("You can also dive Finnart") are primitive but prove divers want site-to-site connections
- **Weaknesses**: UK-only. Static content (no user reviews or community). Not scalable beyond one dedicated author
- **Lesson for Columbus**: Finstrokes proves that divers deeply value practical detail (parking, hazards, mobile coverage) but this level of detail only works with dedicated authorship — exactly what Columbus's pro-curation model enables. Their "you can also dive..." recommendations are the seed of what Columbus formalizes with structured similarity ratings

#### DiveMate
- **What it does**: Dive logging with 170+ dive computer models supported via USB/IR/Bluetooth. 20+ offline map layers. Equipment tracking, gas calculations, SAC/RMV computation, buddy signatures, profile analysis
- **Strengths**: Broadest dive computer compatibility. Offline maps are critical for divers in remote locations. Technical depth (gas calculations, SAC tracking) serves advanced divers
- **Weaknesses**: Logging-focused with no community or discovery features. Map pack and data pack are paid add-ons (freemium friction). Complex feature set for casual divers
- **Lesson for Columbus**: DiveMate shows that offline maps matter for divers (often in remote locations with poor connectivity) — validates our PWA offline strategy. But its complexity is the exact opposite of Columbus's UX goals. The paid extension pack model is a potential monetization reference

#### ScubaBoard
- **What it does**: World's largest scuba diving forum. Dive site reviews live in threads. Equipment discussions, trip reports, buddy finding, dive coordination
- **Strengths**: Massive, engaged community. Reviews from "all types of divers, all levels, all income brackets." Thread discussions surface nuanced, subjective opinions that no structured review can capture. The "what makes a good dive site" thread revealed that divers prioritize: good viz, easy entry/exit, lots of interesting marine life, shelter from currents, no crowding, safety — and that "it all depends on your point of view"
- **Weaknesses**: Knowledge is trapped in threads — impossible to search "sites similar to Richelieu Rock." Forum format means great information is buried. No structured data. Conversations about "this dive is like that dive" happen constantly but are ephemeral
- **Lesson for Columbus**: ScubaBoard is proof that the comparison conversation already happens — divers naturally say "if you liked X, try Y because..." in forums. Columbus just gives this conversation a structured, searchable home. The "it all depends on your point of view" insight validates Columbus's subjective approach — there's no single answer, just different divers' perspectives on similarity

#### Scuba Advisor (ADTO)
- **What it does**: European dive trip rating portal where only verified travelers (who booked through ADTO member operators) can rate trips. Categories: liveaboards, dive shops, resorts. Multilingual (EN/DE/FR/NL)
- **Strengths**: Verified-purchase reviews solve the trust problem. Operator-specific ratings (luxury, safety, food, staff, value) are structured and useful
- **Weaknesses**: Only 19 participating operators. Walled garden — you can only review trips booked through ADTO members. Limited geographic coverage
- **Lesson for Columbus**: The verified-review model (only people who actually did the thing can rate it) is powerful for trust. Columbus's certification gate serves a similar purpose — you must be a certified diver to participate, which filters out noise. Their category-based ratings (not just a single star) validate structured rating approaches

#### Scuba Diving Magazine Readers Choice
- **What it does**: Annual survey (33rd year, 8K-13K responses). Rates destinations across specific categories on 1-5 scales
- **Categories identified**: Best Overall, Big Animals, Macro Life, Visibility, Wall Diving, Wreck Diving, Shore Diving, Shallow Diving, Underwater Photography, Healthy Marine Life, Beginner-friendly, Advanced Diving, Best Value. Operators rated on: Luxury, Safety, Food, Staff, Value
- **Lesson for Columbus**: This is the closest existing taxonomy for evaluating dive destinations, and it's revealing. Their categories overlap significantly with Columbus's 5 axes: Big Animals ≈ Pelagic, Macro Life ≈ Macro, Visibility ≈ Visibility. They add Wall Diving/Wreck Diving (which Columbus captures in site_type), Photography (which correlates with visibility + marine life), and Healthy Marine Life (which could be a future axis). The survey validates that divers think in these dimensional terms when comparing. Columbus's 5 axes are a curated subset optimized for site-to-site similarity rather than absolute rating

### 1.2 Key Market Gaps Columbus Fills

1. **No structured similarity/comparison tool exists** — divers compare sites in conversations (ScubaBoard threads, WhatsApp groups, dive briefings) but no platform captures this knowledge. Columbus is the only tool answering "what's similar to X?"
2. **Information overload is universal** — every platform tries to be everything (PADI: logging+training+shopping, Deepblu: social+business+logging, Divezone: blog+marketplace+jobs). Columbus does one thing
3. **Subjective experience is unstructured** — "this site reminded me of..." has no home. Deepblu buries it in social feeds. ScubaBoard traps it in threads. Columbus makes it a first-class, searchable entity
4. **Pro-curated vs amateur data quality** — Zentacle and WannaDive suffer from uneven quality because anyone can add sites. Columbus's pro-only site entry ensures baseline quality while still letting all certified divers contribute comparisons
5. **Persistent knowledge vs ephemeral content** — Social feeds (Deepblu), forum threads (ScubaBoard), and chat groups (WhatsApp) all lose information over time. Columbus comparisons are permanent, aggregated, and searchable

### 1.3 What Divers Actually Compare Sites On

From Scuba Diving Magazine Readers Choice categories, ScubaBoard discussions, dive site review taxonomies (Smeltzer's weighted system), and Deepblu community group names:

- **Pelagic life** — big marine animals (mantas, sharks, whale sharks). Scuba Diving Magazine's "Best for Big Animals" category. Highest-weighted factor in Smeltzer's review system
- **Macro life** — small creatures (nudibranchs, seahorses, frogfish). Deepblu groups "Macro Freaks" and "Nudibranch Junkies" show passionate specialization
- **Landscape/topography** — walls, caves, pinnacles, coral gardens. Magazine categories "Wall Diving" and "Wreck Diving" show these drive destination choice
- **Currents** — drift diving conditions, strength, predictability. ScubaBoard: "shelter from wind/currents" as key safety factor. Strong currents attract pelagics but deter beginners
- **Visibility** — water clarity, seasonal variation. Universally cited as the #1 practical factor: "If you cannot see it, you might as well be diving in your bathtub"
- Secondary factors (not in Columbus v1 axes but noted): temperature, depth, accessibility/entry, safety, crowding, coral health, photography potential

### 1.4 Certification Verification Reality

- PADI: No public API. App-based lookup, website login, e-cards
- SSI: my.DiveSSI.com online diver check (no API)
- TDI/SDI: Cert search page available
- Other agencies (NAUI, BSAC, CMAS, RAID): Various online directories, no APIs
- **Pragmatic approach for Columbus**: Self-reported cert number + agency. The certification acts as a gating mechanism (you must be a diver to use this) rather than a verified identity system. Link to agency verification pages for optional manual verification by admins for pro upgrades

### 1.5 Patterns to Adopt

| Pattern | Source | How Columbus Uses It |
|---------|--------|---------------------|
| Card-based site display with hero images | Zentacle | Site cards on map popups and search results |
| Geographic hierarchy (country → region → site) | WannaDive, Zentacle | Navigation and search grouping |
| Difficulty level per site | Zentacle | Add to DiveSite model as simple beginner/intermediate/advanced |
| Structured multi-category ratings (not just one star) | Scuba Advisor, Readers Choice, Smeltzer | The 5 similarity axes |
| Community organized around interest niches | Deepblu groups | The 5 axes effectively create implicit interest groups |
| Certification gating for trust | Scuba Advisor (verified purchase) | Cert-required signup filters to real divers |
| Practical site details from pros | Finstrokes | Pro-authored site descriptions with real operational info |
| Seasonal/condition data | WannaDive, PADI | Future: add best-season metadata to dive sites |
| Offline map capability | DiveMate, PWA research | Service worker caching for recently viewed sites |

### 1.6 Anti-Patterns to Avoid

| Anti-Pattern | Where We Saw It | Columbus's Alternative |
|-------------|-----------------|----------------------|
| Trying to be everything (logging + training + booking + social + gear) | PADI, Deepblu, DiveLife | One thing: comparison. No logbook, no training, no booking |
| Social feed as primary content container (posts get buried) | Deepblu | Comparisons are permanent searchable entities, not timeline items |
| Generic star ratings without meaningful categories | Zentacle, Divezone ("dive rating") | 5 specific axes that map to how divers actually think |
| Uncontrolled user-generated site data (quality varies) | WannaDive, Zentacle (many sites with 0 reviews) | Pro-only site creation ensures quality baseline |
| Ecosystem lock-in (SSI-only, PADI-only) | MySSI, PADI App | Agency-agnostic from day one |
| Feature creep via marketplace/jobs/blog | Divezone | No monetization features in v1. Focus on core value |
| Wiki editing model (high friction, low participation) | WannaDive | Pro curation is faster; comparison submission is low-friction for all divers |
| Carousel navigation for content browsing | Zentacle | List/grid for scannability; carousel only for image galleries |
| Requiring dive computer sync for full value | Deepblu, DiveMate | Zero hardware dependencies. Works with any browser |
| Aggressive email verification / data harvesting concerns | Various (ScubaBoard users complained) | Transparent, minimal data collection. Cert number + email, nothing more |

### 1.7 Research Sources

- [PADI Mobile Apps](https://www.padi.com/scuba-diving-mobile-apps) — [PADI Dive Site Discovery](https://blog.padi.com/discover-top-dive-sites-with-the-padi-app/)
- [MySSI App](https://www.divessi.com/en/blog/updated-myssi-app-8863.html) — [PADI vs SSI Review](https://oceantribe.co/news-offers/app-review-new-padi-app-vs-ssi-app-which-is-better/)
- [Deepblu Platform](https://www.divephotoguide.com/underwater-photography-special-features/article/deepblu-making-dive-world-more-connected/) — [Deepblu Social Launch](https://www.deeperblue.com/deepblu-launch-new-web-app-diver-social-media-network/)
- [Zentacle](https://www.zentacle.com) — [Divezone](https://divezone.net/)
- [WannaDive World Atlas](https://www.wannadive.net)
- [DiveSpot](https://divespot.app/) — [DiveMate](https://www.divemate.de/)
- [Finstrokes UK Guides](https://www.finstrokes.com/)
- [Scuba Advisor (ADTO)](https://en.scuba-advisor.com/)
- [ScubaBoard — What Makes a Good Dive Site](https://scubaboard.com/community/threads/what-makes-a-good-dive-site.7499/)
- [ScubaBoard — Dive Site Finder](https://scubaboard.com/community/threads/dive-site-finder.629764/)
- [ScubaBoard — Global Dive Site Map](https://scubaboard.com/community/threads/any-websites-that-show-all-dive-sites-worldwide-on-a-google-map.481121/)
- [ScubaBoard — Dive Coordination](https://scubaboard.com/community/threads/using-technology-to-coordinate-dives.553575/)
- [Dive Site Review Methodology (Smeltzer)](https://blog.stevenwsmeltzer.com/dive-site-reviews/)
- [UX Case Study: PADI App Redesign](https://medium.com/@liweikuan0106/ux-case-study-d53b629ec503)
- [Top 15 Diving Apps (TDI/SDI)](https://www.tdisdi.com/sdi-diver-news/top-15-must-have-scuba-diving-apps-for-android-and-ios/)
- [10 Must-Have Diving Apps](https://www.diveapps.com/top-diving-apps-user-reviews)
- [UW Photography Destinations](https://www.uwphotographyguide.com/underwater-photography-destinations)
- [Scuba Diving Magazine Readers Choice](https://www.scubadiving.com/readers-choice-awards)
- [Cognitive Load in UX](https://www.smashingmagazine.com/2016/09/reducing-cognitive-overload-for-a-better-user-experience/)

---

## 2. Product Vision

**One-liner**: The subjective comparison engine for dive sites worldwide.

**Core principle**: Do one thing well. Columbus is not a logbook, not a booking platform, not a social network. It's where you go to answer: *"What's a dive site similar to [X]?"*

This is the question that lives in ScubaBoard threads, WhatsApp groups, and dive briefing conversations — but has never had a structured, searchable home.

### User Roles

| Role | Can Do |
|------|--------|
| **Diver** (authenticated) | Browse sites, search, view comparisons, submit similarity ratings, upload images, write comparison notes |
| **Pro** (verified dive professional) | Everything a Diver can do + create/edit dive site entries (the only way sites enter the system) |
| **Admin** | Manage users, moderate content, manage pro verification |

### Core Features

1. **Dive site directory** — Pro-curated entries with lat/long, displayed on a Mapbox globe. Unlike Zentacle/WannaDive where anyone can add sites (leading to uneven quality), Columbus ensures every site has baseline quality through pro authorship
2. **Similarity engine** — Structured comparison: pick two sites, rate similarity across 5 optional axes (pelagic, macro, landscape, currents, visibility — min 1 required), add a text note (<100 words). This is the feature no competitor has
3. **Search & discovery** — Find sites, find sites similar to a given site, filter by attributes. Inspired by how ScubaBoard users naturally ask "what's like X?" but structured and searchable
4. **Image gallery** — Photos tagged to dive sites and comparisons. Simpler than Deepblu's depth-profile mapping but still connects visual evidence to specific sites
5. **Auth gated by diving certification** — PADI/SSI/NAUI/BSAC/CMAS/SDI number required at signup. Inspired by Scuba Advisor's verified-purchase model — ensures participants are actual divers

---

## 3. Data Model

### Users
```
User {
  id: UUID
  email: string
  password_hash: string
  display_name: string
  cert_agency: enum [PADI, SSI, NAUI, BSAC, CMAS, SDI, TDI, RAID, OTHER]
  cert_number: string
  cert_level: string (e.g. "Open Water", "Divemaster", "Instructor")
  role: enum [diver, pro, admin]
  avatar_url: string?
  created_at: timestamp
}
```

### Dive Sites (pro-created only)
```
DiveSite {
  id: UUID
  name: string
  slug: string (unique, URL-friendly)
  description: string
  latitude: float
  longitude: float
  country: string
  region: string
  difficulty: enum [beginner, intermediate, advanced]  -- adopted from Zentacle
  max_depth_m: float?
  typical_visibility_m: range?
  access_type: enum [shore, boat, both]  -- adopted from Zentacle
  site_type: enum[] [wall, reef, wreck, cave, drift, muck, pinnacle, shore, deep]
  created_by: User(pro)
  created_at: timestamp
  updated_at: timestamp
  image_count: int (derived)
  similarity_count: int (derived)
}
```

### Similarities (the core entity)
```
Similarity {
  id: UUID
  site_a_id: DiveSite
  site_b_id: DiveSite
  created_by: User
  pelagic_rating: int? (1-5)
  macro_rating: int? (1-5)
  landscape_rating: int? (1-5)
  currents_rating: int? (1-5)
  visibility_rating: int? (1-5)
  -- constraint: at least one rating must be non-null
  note: string (max 100 words)
  created_at: timestamp
}
```

### Images
```
Image {
  id: UUID
  url: string
  thumbnail_url: string
  uploaded_by: User
  dive_site_id: DiveSite?
  similarity_id: Similarity?
  caption: string?
  created_at: timestamp
}
```

### Key Indexes
- `DiveSite(latitude, longitude)` — geospatial (PostGIS GIST index)
- `DiveSite(slug)` — unique, for URL routing
- `DiveSite(country, region)` — regional queries
- `Similarity(site_a_id), Similarity(site_b_id)` — lookup similarities for a site
- `Similarity(created_by)` — user's comparisons
- Full-text search index on `DiveSite(name, description, country, region)` using pg_trgm

---

## 4. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO on site pages (critical for discovery — learned from Zentacle's SEO approach), RSC for performance, API routes built-in, PWA plugin ecosystem |
| **Language** | TypeScript | Type safety across stack |
| **Styling** | Tailwind CSS | Utility-first, fast iteration, consistent design system |
| **UI Components** | shadcn/ui | Accessible, unstyled primitives. Clean aesthetic matching Zentacle's whitespace-forward design |
| **Database** | PostgreSQL 16 (Docker, `postgres:16-alpine`) | Local dev via Docker Compose on port 5433. No cloud dependency. PostGIS can be added when needed for geospatial queries |
| **ORM** | Drizzle ORM + postgres.js | Type-safe, lightweight, direct postgres connection |
| **Auth** | NextAuth v5 (credentials provider) | Self-hosted, JWT sessions, bcrypt password hashing. No third-party auth dependency. Replaces Supabase Auth (removed due to IPv6/connectivity issues) |
| **Maps** | Mapbox GL JS | Best-in-class for interactive globe/map. Geocoding API for search. Supports offline tile packs |
| **Image Storage** | Local filesystem (S3-compatible in future) | Keep it simple for MVP |
| **PWA** | next-pwa / Serwist | Service worker generation, offline caching, install prompt |
| **Hosting** | Docker Compose (local) / Vercel (future) | Dev runs entirely local. Production deployment TBD |
| **Search** | PostgreSQL full-text search (pg_trgm) | Good enough to start. No need for Elasticsearch at this scale |

---

## 5. UX Principles

### Cognitive Load Management

Research across platforms reveals a universal problem: diving has inherently complex information (depth, gas mix, visibility, currents, marine life, equipment, certification levels) and every app tries to capture all of it upfront. Smashing Magazine's cognitive overload research confirms: users given more than 7 options struggle to make decisions. Diving apps routinely present 15+ data fields on a single screen.

Columbus applies:

1. **Progressive disclosure** — Show the minimum needed at each step. Details expand on demand, never forced upfront. Learned from how PADI's flat UI overwhelms vs Finstrokes' logical section-by-section flow
2. **Miller's Law (7 +/- 2)** — No screen presents more than 7 primary actions or data points. The similarity form has exactly 5 axes + 1 note field + 1 submit button = 7
3. **Optional complexity** — All 5 similarity axes are optional (min 1). Don't force ratings on dimensions the diver didn't notice. This is the core insight from the user's brief: "there should be a reason why it's similar" — let divers express what they actually noticed, not fill in blanks
4. **Recognition over recall** — Dive site search with autocomplete, not manual entry of names/coordinates. Learned from WannaDive's wiki model where users struggled to find/enter correct GPS data
5. **Single primary action per screen** — Each view has one clear thing to do next. Anti-pattern: PADI app where the home screen has training, logging, shopping, and social all competing for attention
6. **Smart forms with conditional logic** — Show/hide fields based on context. Pro creating a wreck? Show wreck-specific fields. Creating a reef? Different set. Reduces perceived form length

### Design Guidelines

- **Clean white space** — Zentacle's design proves this works in the dive space. Let content breathe. No cramped data tables
- **Card-based layout** — Dive sites and comparisons as cards, scannable at a glance. Hero image + name + region + similarity count. Proven by Zentacle
- **Blue-dominant palette** — Ocean theme but restrained. Not the dark/tactical diving-gear aesthetic of DiveMate. Closer to Zentacle's clean blues
- **Mobile-first** — PWA means phone is primary device. Design for thumb-reach zones. Many divers check sites on their phones at the dive center or on the boat
- **Minimal chrome** — Bottom nav (mobile), sparse top bar. Content is the UI. Anti-pattern: Divezone's extensive dropdown menus
- **Map as home** — The globe/map is the landing experience. Explore visually first, search second. Validated by every successful platform (PADI, DiveSpot, Zentacle, WannaDive) — divers are visual, geographic thinkers
- **List/grid for results, not carousels** — Zentacle's carousels are slow for power users. Use scrollable lists with clear sort options

### Key Interaction Patterns

- **Search**: Type-ahead with site name + region suggestions (inspired by DiveSpot's natural language approach, simplified)
- **Compare flow**: "Find similar" button on any site card -> select second site -> rate axes -> done. 3 steps, not 10
- **Star ratings**: Simple 1-5 tap/click on each axis. Empty = skipped (not zero). Tapping a filled star clears it — undo should be effortless
- **Image upload**: Drag-drop or camera capture. Tag to site or comparison inline. Simpler than Deepblu's depth-profile mapping but still functional

---

## 6. Core User Flows

### Flow 1: Registration
```
Landing -> Sign Up -> Email + Password -> Cert Details (agency dropdown, cert number, cert level) -> Account Created (role: diver)
```
Pro upgrade: separate verification flow (admin-approved). Cert details screen has clear "Why do we ask this?" tooltip explaining the trust model — addresses the data-harvesting concerns ScubaBoard users raised about dive platforms.

### Flow 2: Browse & Discover (Home)
```
Map View (Mapbox globe) -> Click cluster/pin -> Site Card popup (name, region, type, hero image, difficulty badge, similarity count) -> Site Detail Page
```
Mapbox clusters prevent pin overload. Zoom into a region to see individual sites. Geographic hierarchy (continent → country → region) available as alternative to map browsing — learned from WannaDive's proven navigation pattern.

### Flow 3: Dive Site Detail
```
Site name, description, location on mini-map
Badges: difficulty (beginner/intermediate/advanced), access type (shore/boat), site type tags
Image gallery (horizontal scroll — carousel is OK here for a single site's photos)
"Similar Sites" section — list of comparisons showing aggregated similarity scores per axis
"Add Similarity" CTA button (prominent, primary action)
```
The detail page is the launchpad for comparison — not a dead-end information page.

### Flow 4: Add Similarity (the core action)
```
Start from Site A -> "Find Similar" -> Search/select Site B -> Rate screen:
  [Pelagic:   _ _ _ _ _]  (optional, tap to rate)
  [Macro:     _ _ _ _ _]  (optional)
  [Landscape: _ _ _ _ _]  (optional)
  [Currents:  _ _ _ _ _]  (optional)
  [Visibility:_ _ _ _ _]  (optional)
  [Note: ______________ ] (max 100 words, placeholder: "Why are these sites similar?")
  [Add photos] (optional)
  -> Submit
```
Validation: at least 1 axis rated. Error shown inline, not as a modal. The whole flow is completable in under 60 seconds for a returning user.

### Flow 5: Pro Creates Dive Site
```
Pro dashboard -> "Add Site" -> Name + Description -> Pin on map (click to place, or type coords) -> Country/Region (auto-filled from Mapbox geocode) -> Difficulty + Access type -> Site type tags (multi-select chips) -> Optional: max depth, typical visibility range -> Submit
```
Progressive disclosure: only name, description, and map pin are required. Everything else is optional but encouraged. Inspired by Finstrokes' information density — pro pages can be as detailed as the pro wants to make them.

### Flow 6: Search
```
Search bar (persistent top on all pages) -> Type-ahead results grouped by: Sites | Regions -> Select -> Navigate
Filter sidebar (desktop) / bottom sheet (mobile): by region, site type, difficulty, access type, has-images, similarity-count
Sort: most compared, recently added, alphabetical, nearest (if geolocation allowed)
```

---

## 7. Page Structure

```
/                       — Map explorer (home)
/search                 — Search results + filters
/site/[slug]            — Dive site detail
/site/[slug]/similar    — All similarities for a site
/compare                — Start a new comparison
/compare/[id]           — View a specific similarity
/profile                — User profile + their comparisons
/pro/dashboard          — Pro: manage their sites
/pro/add-site           — Pro: add new dive site
/auth/login             — Login
/auth/register          — Registration
/admin                  — Admin panel (user/content moderation)
```

---

## 8. PWA Strategy

Divers frequently lack connectivity — remote islands, liveaboards, developing regions. DiveMate and the pwa-maps research project prove offline maps are critical. Columbus's PWA approach:

- **Service worker**: Cache app shell, map tiles (Mapbox supports offline tile packs for viewed regions), and recently viewed site data
- **Manifest**: Install prompt, splash screen, ocean-blue theme color. Full-screen standalone mode
- **Offline**: Read-only access to previously viewed sites and their comparisons. Queue similarity submissions for sync when back online (inspired by the "smart form" pattern — save locally, push when connected)
- **Push notifications**: Future — notify when someone adds a comparison to a site you've rated

---

## 9. Implementation Phases

### Phase 1: Foundation (MVP) ✅ DONE
- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui v4 (base-ui primitives)
- [x] PostgreSQL 16 via Docker Compose (port 5433, bind-mount data at ./data/postgres)
- [x] Drizzle ORM schema + push to DB
- [x] NextAuth v5 credentials provider (JWT sessions, bcrypt). Supabase removed (IPv6 issues)
- [x] User registration with cert details (agency + level — level options are agency-specific)
- [x] Mapbox GL JS globe with clustered site pins (outdoors-v12 style)
- [x] Dive site CRUD (pro only) with map pin placement + Mapbox geocoding
- [x] Site detail page with difficulty/access/type/depth/visibility badges
- [x] Header with auth state + navigation

### Phase 2: Core Comparison Engine ✅ DONE
- [x] Similarity creation flow (3-step wizard: select sites, rate axes, submit with note)
- [x] Similarity detail page (/compare/[id]) with rating bars
- [x] Aggregated scores on site detail page (per-axis averages across all comparisons)
- [x] Type-ahead site search API (/api/sites/search?q=) — portal dropdown (fixed overflow clipping)
- [x] Search page with client-side filtering (difficulty, access type, site type, has-images)
- [x] Sort on search page (most compared / recently added / A-Z / nearest)
- [x] Similarity deduplication per user+pair

### Phase 3: Images & PWA ✅ DONE
- [x] Image upload API (local filesystem, 5MB max, JPEG/PNG/WebP)
- [x] Sharp processing: full images WebP 2000px/q85, thumbnails WebP 400px/q80
- [x] Image gallery + lightbox on site detail and comparison pages
- [x] PWA manifest + service worker (network-first HTML, cache-first assets)
- [x] Apple web app meta tags, safe area padding
- [x] Mobile bottom nav (Explore / Search / Compare / Profile)

### Phase 4: Discovery ✅ DONE
- [x] User profiles (/profile — comparisons list + pro request button)
- [x] Pro verification workflow (request on profile, admin panel approve/deny)
- [x] Admin panel: pro requests, inline role change per user (diver/pro/admin)
- [x] Admin: delete any comparison with confirmation
- [x] SEO: generateMetadata on /site/[slug] — og:title, description, canonical, JSON-LD TouristAttraction
- [x] /site/[slug]/similar — ranked similarity page (per-axis averages, sorted by overall score, #1/#2 labels)
- [x] Edit dive site (/pro/edit-site/[id]) — pros edit own sites, admins edit any
- [x] Photos on comparison detail page (any logged-in user can upload)
- [x] Similarity + image counts on site list cards and map popups
- [x] typical_visibility_m field on sites
- [x] Description edit suggestions — members submit, admins approve/reject
- [x] Comparison editing with full edit history trail (pre-edit snapshots, collapsible timeline)
- [x] Nearby sites auto-detection (2km Haversine radius) on site detail page
- [x] "Would you dive here again?" thumbs up/down rating on site detail pages
- [x] Rating overview (% + progress bar) in map popup with inline vote buttons
- [x] Geolocation-based sort on search page (nearest first)

### Phase 5: Future
- [ ] Offline mode with queued similarity submissions
- [ ] Push notifications (new comparison on a site you've rated)
- [ ] Seasonal metadata on dive sites (best months, water temp by season)
- [ ] Marine life tagging on sites
- [ ] Advanced search (find sites where pelagic > 4 AND visibility > 3)
- [ ] Natural language search
- [ ] Similarity network graph visualization
