Three features I want to have:

## 1. Gamification & Engagement
Drawing from Google Local Guides, Untappd badges, Letterboxd year-in-review, and Yelp Elite:
Points System

Would Dive: 10 points
Photo upload: 10 points
Similarity comparison: 20 points
Text similarity review (>50 words): 15 points


Reputation Thresholds

0–49: Standard Diver 
50–199: Trusted Reviewer 
200–499: Site Expert 
500+: Community Leader

Badges

"Site Explorer" — 1 detailed comparisons at different sites
"Globe Trotter" — rated comparisons in 5+ countries
"Connector" — submitted 25 similarity comparisons

Might have to re-plan this based on how the current system is


## 2. Database Bootstrapping Strategy
 
### The Problem
 
Community-driven platforms face chicken-and-egg: no users → no data → no users. Zentacle's many zero-review sites prove the risk. Columbus solves this by seeding authoritative content before launch.
 
### Layer 1: Site Data (target: 5,000–10,000 unique sites on day one)
 
| Source | Sites | Data Fields | Access | License |
|--------|-------|-------------|--------|---------|
| OpenStreetMap (Overpass API) | ~5,000–8,000 | GPS, depth, difficulty (1-3), type flags (wreck/wall/cave/drift), reef features | REST, no auth | ODbL |
| Dive Vibe Community (GitHub) | 2,800+ | GPS, site type, depth, difficulty, entry type, description, marine life | CSV/JSON download | Open source |
| Diveboard (REST API + seed DB) | 65,000+ spots (deduplicated to ~10K unique) | GPS, depth, visibility, current, temp, species arrays | API key via email, seed DB download | CC BY-NC-ND 3.0 |
| TheDiveAPI | 17,000 sites + 10,000 operators | GPS, operator data | REST, JSON | Check terms |
| DiveSites.com API | Unknown count | GPS, search | REST | Check terms |
 
**Deduplication pipeline**: Match sites within 500m radius on GPS coordinates + fuzzy name matching (pg_trgm similarity > 0.3). Merge metadata, prefer the most complete record. Store `data_source` provenance for attribution.
 
**OSM Overpass query** for dive sites:
```
[out:json][timeout:90];
(
  node["sport"="scuba_diving"];
  way["sport"="scuba_diving"];
  node["seamark:type"="wreck"];
  node["natural"="reef"];
);
out body;
```
Filter out dive shops by excluding nodes with `shop=*` tags or lacking `scuba_diving:depth`.
 
### Layer 2: Species Data (auto-populate "What You'll See")
 
| Source | Coverage | Key Endpoint | License |
|--------|----------|-------------|---------|
| OBIS | 100M+ marine occurrences, ~120K species | `GET api.obis.org/v1/checklist?geometry=POINT(lng lat)&distance=5000` | Open |
| GBIF | 2.6B+ occurrences (marine subset) | `GET api.gbif.org/v1/occurrence/search?decimalLatitude=X&decimalLongitude=Y&radius=5` | CC0/CC BY |
| iNaturalist | Photo-verified observations | `GET api.inaturalist.org/v1/observations?lat=X&lng=Y&radius=5&quality_grade=research` | CC varies |
| WoRMS | Taxonomic backbone, AphiaIDs | `GET marinespecies.org/rest/AphiaRecordsByName/{name}` | CC BY 4.0 |
| FishBase/SeaLifeBase | 235K+ species, common names, ecology | S3 Parquet files or legacy REST | CC BY 4.0 |
 
**Pipeline per site**: Query OBIS/GBIF within 5km radius → deduplicate species by AphiaID → enrich with WoRMS common names → fetch representative images from iNaturalist → store in `DiveSiteSpecies` junction table. Run as a background job, batch processing 100 sites/day to respect API rate limits.
 
### Layer 3: Environmental Data
 
| Source | Data | Endpoint | License |
|--------|------|----------|---------|
| NOAA ERDDAP | SST, chlorophyll (visibility proxy) | `coastwatch.pfeg.noaa.gov/erddap/` | Public domain |
| Open-Meteo Marine | Wave height, period, water temp | `open-meteo.com/en/docs/marine-weather-api` | Free non-commercial |
| GEBCO | Bathymetry (15 arc-sec resolution) | Grid download | Open |
 
Use environmental data to: infer initial axis scores (chlorophyll → visibility proxy, bathymetry → landscape proxy), populate seasonal metadata (best months to dive based on historical SST/wave patterns), and enrich site cards with current conditions.
 
### Layer 4: Seed Ratings (inferred from metadata)
 
For bootstrapped sites with no user ratings, infer initial `profile_vector` values from metadata:
- **Landscape**: site_type=wall→4.5, cave→4.5, wreck→4.0, pinnacle→4.0, reef→3.0, muck→1.5
- **Currents**: from Diveboard `current` field or description NLP
- **Visibility**: from Diveboard `visibility` field or chlorophyll proxy
- **Pelagic/Macro**: from species list composition (large species count → pelagic score, nudibranch/seahorse presence → macro score)
 
Mark inferred ratings clearly in UI: "Based on site data — be the first to rate!" Inferred scores are replaced by user ratings as they accumulate.
 

 ## 3. Onboarding/visual intro

 A guide that takes a user through the entire site and how to go about it. Should have a guided tour type of thingy