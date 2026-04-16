"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, X } from "lucide-react";
import type { DiveSite } from "@/db/schema";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const DEFAULT_CENTER: [number, number] = [20, 15];
const DEFAULT_ZOOM = 1.8;

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function fuzzyMatch(query: string, ...fields: string[]): boolean {
  const words = normalise(query).split(" ").filter(Boolean);
  const haystack = fields.map(normalise).join(" ");
  return words.every((w) => haystack.includes(w));
}

interface DiveMapProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
  heroImages?: Record<string, string>;
  ratingData?: Record<string, { yes: number; no: number }>;
  loggedIn?: boolean;
  userVotes?: Record<string, boolean>;
  userComparisons?: Record<string, boolean>;
  onSiteClick?: (site: DiveSite) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  className?: string;
  totalSites?: number;
}

type PinType = "default" | "rated" | "compared" | "both";

// Draw a canvas-based pin image for map.addImage()
// - default:  solid blue   (#0369a1)  — never interacted
// - rated:    solid amber  (#f59e0b)  — user cast a thumbs up/down
// - compared: solid teal   (#0d9488)  — user submitted a comparison
// - both:     split circle — left amber / right teal + white divider
function createPinImage(type: PinType): ImageData {
  const dp = 20;     // logical size in dp
  const dpr = 2;     // pixel ratio
  const px = dp * dpr;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const cx = dp / 2;   // 10
  const cy = dp / 2;   // 10
  const r = 8;

  if (type === "both") {
    // Left half — amber (rated)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true); // counterclockwise → left arc
    ctx.closePath();
    ctx.fillStyle = "#f59e0b";
    ctx.fill();

    // Right half — teal (compared)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false); // clockwise → right arc
    ctx.closePath();
    ctx.fillStyle = "#0d9488";
    ctx.fill();

    // White centre divider
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    const fill = type === "rated" ? "#f59e0b" : type === "compared" ? "#0d9488" : "#0369a1";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Outer white stroke on all types
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  return ctx.getImageData(0, 0, px, px);
}

// Build rating section as a real DOM element (avoids Mapbox v3 HTML sanitizer stripping onclick)
function buildRatingElement(
  siteId: string,
  rating: { yes: number; no: number } | undefined,
  myVote: boolean | null,
  loggedIn: boolean,
  onVote: (value: boolean) => void,
): HTMLElement {
  const yes = rating?.yes ?? 0;
  const no = rating?.no ?? 0;
  const total = yes + no;
  const pct = total > 0 ? Math.round((yes / total) * 100) : 0;

  const wrap = document.createElement("div");
  wrap.id = `popup-rating-${siteId}`;
  wrap.style.cssText = "margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;";

  // Progress bar (shown when there are votes)
  if (total > 0) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;";
    const lbl = document.createElement("span");
    lbl.style.cssText = "font-size:11px;color:#64748b;";
    lbl.textContent = "Would dive again";
    const pctEl = document.createElement("span");
    pctEl.style.cssText = "font-size:12px;font-weight:600;color:#0369a1;";
    pctEl.textContent = `${pct}%`;
    row.appendChild(lbl);
    row.appendChild(pctEl);
    wrap.appendChild(row);

    const track = document.createElement("div");
    track.style.cssText = "height:4px;background:#e5e7eb;border-radius:9999px;overflow:hidden;";
    const fill = document.createElement("div");
    fill.style.cssText = `height:100%;width:${pct}%;background:#0369a1;border-radius:9999px;`;
    track.appendChild(fill);
    wrap.appendChild(track);

    const count = document.createElement("p");
    count.style.cssText = "font-size:10px;color:#94a3b8;margin:3px 0 0;";
    count.textContent = `${total} rating${total !== 1 ? "s" : ""}`;
    wrap.appendChild(count);
  }

  if (!loggedIn) {
    if (total === 0) {
      const p = document.createElement("p");
      p.style.cssText = "font-size:11px;color:#94a3b8;margin:0;";
      p.textContent = "No ratings yet";
      wrap.appendChild(p);
    }
    return wrap;
  }

  // Logged in — show vote UI
  if (myVote !== null) {
    // Already voted
    const row = document.createElement("div");
    row.style.cssText = `display:flex;align-items:center;justify-content:space-between;margin-top:${total > 0 ? "5px" : "0"};`;
    const lbl = document.createElement("span");
    lbl.style.cssText = "font-size:11px;color:#64748b;";
    lbl.innerHTML = `Your vote: <strong style="color:${myVote ? "#0369a1" : "#dc2626"}">${myVote ? "Yes" : "No"}</strong>`;
    const btn = document.createElement("button");
    btn.style.cssText = "font-size:10px;color:#64748b;border:1px solid #e5e7eb;background:#f8fafc;border-radius:4px;padding:2px 7px;cursor:pointer;";
    btn.textContent = `Switch to ${myVote ? "No" : "Yes"}`;
    btn.addEventListener("click", (e) => { e.stopPropagation(); onVote(!myVote); });
    row.appendChild(lbl);
    row.appendChild(btn);
    wrap.appendChild(row);
  } else {
    // Not voted yet
    if (total === 0) {
      const heading = document.createElement("p");
      heading.style.cssText = "font-size:11px;color:#64748b;margin:0 0 5px;font-weight:500;";
      heading.textContent = "Would you dive here again?";
      wrap.appendChild(heading);
    }
    const btnRow = document.createElement("div");
    btnRow.style.cssText = `display:flex;gap:6px;margin-top:${total > 0 ? "6px" : "0"};`;

    const yesBtn = document.createElement("button");
    yesBtn.style.cssText = "flex:1;font-size:11px;color:#0369a1;border:1px solid #bae6fd;background:#f0f9ff;border-radius:4px;padding:4px 0;cursor:pointer;font-weight:500;";
    yesBtn.textContent = "👍 Yes";
    yesBtn.addEventListener("click", (e) => { e.stopPropagation(); onVote(true); });

    const noBtn = document.createElement("button");
    noBtn.style.cssText = "flex:1;font-size:11px;color:#dc2626;border:1px solid #fecaca;background:#fff5f5;border-radius:4px;padding:4px 0;cursor:pointer;font-weight:500;";
    noBtn.textContent = "👎 No";
    noBtn.addEventListener("click", (e) => { e.stopPropagation(); onVote(false); });

    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    wrap.appendChild(btnRow);
  }

  return wrap;
}

export function DiveMap({
  sites,
  similarityCounts = {},
  heroImages = {},
  ratingData = {},
  loggedIn = false,
  userVotes = {},
  userComparisons = {},
  onSiteClick,
  interactive = true,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "h-full w-full",
  totalSites,
}: DiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCount, setMatchCount] = useState(totalSites ?? 0);
  const map = useRef<mapboxgl.Map | null>(null);
  const sitesRef = useRef(sites);
  sitesRef.current = sites;
  const similarityCountsRef = useRef(similarityCounts);
  similarityCountsRef.current = similarityCounts;
  const heroImagesRef = useRef(heroImages);
  heroImagesRef.current = heroImages;
  const ratingDataRef = useRef(ratingData);
  ratingDataRef.current = ratingData;
  const userVotesRef = useRef(userVotes);
  userVotesRef.current = userVotes;
  const userComparisonsRef = useRef(userComparisons);
  userComparisonsRef.current = userComparisons;
  const loggedInRef = useRef(loggedIn);
  loggedInRef.current = loggedIn;

  const onSiteClickRef = useRef(onSiteClick);
  onSiteClickRef.current = onSiteClick;

  const handleClusterClick = useCallback(
    (
      mapInstance: mapboxgl.Map,
      features: mapboxgl.GeoJSONFeature[],
      lngLat: mapboxgl.LngLat
    ) => {
      const clusterId = features[0].properties?.cluster_id;
      const source = mapInstance.getSource("sites") as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
        if (err) return;
        mapInstance.easeTo({
          center: lngLat,
          zoom: expansionZoom ?? 10,
        });
      });
    },
    []
  );

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center,
      zoom,
      projection: "globe",
      interactive,
      customAttribution: [
        'Dive site data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        '<a href="https://www.diveboard.com" target="_blank" rel="noopener noreferrer">Diveboard</a> (<a href="https://creativecommons.org/licenses/by-nc-nd/3.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 3.0</a>)',
      ].join(" · "),
    });

    mapInstance.on("style.load", () => {
      mapInstance.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });
    });

    async function voteOnSite(siteId: string, value: boolean) {
      const el = document.getElementById(`popup-rating-${siteId}`);
      if (el) el.style.opacity = "0.5";
      try {
        const res = await fetch(`/api/sites/${siteId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wouldDiveAgain: value }),
        });
        if (res.ok) {
          const data = (await res.json()) as { yes: number; no: number };
          ratingDataRef.current = { ...ratingDataRef.current, [siteId]: data };
          userVotesRef.current = { ...userVotesRef.current, [siteId]: value };
          const existing = document.getElementById(`popup-rating-${siteId}`);
          if (existing) {
            const replacement = buildRatingElement(siteId, data, value, true, (v) => voteOnSite(siteId, v));
            existing.replaceWith(replacement);
          }
          // Refresh pin colours to reflect the new rating
          const src = mapInstance.getSource("sites") as mapboxgl.GeoJSONSource;
          if (src) {
            src.setData({
              type: "FeatureCollection",
              features: sitesRef.current.map((s) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
                properties: {
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  country: s.country,
                  region: s.region,
                  difficulty: s.difficulty,
                  siteTypes: JSON.stringify(s.siteTypes),
                  hasRated: s.id in userVotesRef.current,
                  hasCompared: !!userComparisonsRef.current[s.id],
                },
              })),
            });
          }
        }
      } catch {
        if (el) el.style.opacity = "1";
      }
    }

    mapInstance.on("load", () => {
      // Register pin images for the 4 interaction states
      (["default", "rated", "compared", "both"] as const).forEach((type) => {
        mapInstance.addImage(`pin-${type}`, createPinImage(type), { pixelRatio: 2 });
      });

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: sitesRef.current.map((site) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [site.longitude, site.latitude],
          },
          properties: {
            id: site.id,
            name: site.name,
            slug: site.slug,
            country: site.country,
            region: site.region,
            difficulty: site.difficulty,
            siteTypes: JSON.stringify(site.siteTypes),
            hasRated: site.id in userVotesRef.current,
            hasCompared: !!userComparisonsRef.current[site.id],
          },
        })),
      };

      mapInstance.addSource("sites", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      setMatchCount(sitesRef.current.length);

      // Cluster circles
      mapInstance.addLayer({
        id: "clusters",
        type: "circle",
        source: "sites",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#7dd3fc", // sky-300
            10,
            "#38bdf8", // sky-400
            50,
            "#0284c7", // sky-600
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            50,
            32,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Cluster count labels
      mapInstance.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "sites",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#fff",
        },
      });

      // Individual site markers — symbol layer with data-driven pin images
      mapInstance.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: "sites",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": [
            "case",
            // Both rated AND compared → split circle
            ["all", ["coalesce", ["get", "hasRated"], false], ["coalesce", ["get", "hasCompared"], false]],
            "pin-both",
            // Rated only → amber
            ["coalesce", ["get", "hasRated"], false],
            "pin-rated",
            // Compared only → teal
            ["coalesce", ["get", "hasCompared"], false],
            "pin-compared",
            // Never interacted → blue
            "pin-default",
          ],
          "icon-allow-overlap": true,
        },
      });

      // Click on cluster -> zoom in
      mapInstance.on("click", "clusters", (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;
        handleClusterClick(mapInstance, features, e.lngLat);
      });

      // Click on individual site -> show popup
      mapInstance.on("click", "unclustered-point", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (!props) return;

        const site = sitesRef.current.find((s) => s.id === props.id);
        if (site && onSiteClickRef.current) {
          onSiteClickRef.current(site);
        }

        const simCount = similarityCountsRef.current[props.id] ?? 0;
        const heroImg = heroImagesRef.current[props.id];
        const rating = ratingDataRef.current[props.id];
        const myVote = props.id in userVotesRef.current ? userVotesRef.current[props.id] : null;

        const siteTypes: string[] = props.siteTypes ? JSON.parse(props.siteTypes) : [];

        // Build popup as real DOM to avoid Mapbox v3 HTML sanitizer stripping onclick
        const container = document.createElement("div");
        container.style.cssText = "font-family:system-ui,sans-serif;font-size:13px;";

        if (heroImg) {
          const img = document.createElement("img");
          img.src = heroImg;
          img.style.cssText = "width:100%;height:72px;object-fit:cover;border-radius:4px;margin-bottom:6px;display:block;";
          container.appendChild(img);
        }

        const link = document.createElement("a");
        link.href = `/site/${props.slug}`;
        link.style.cssText = "text-decoration:none;color:inherit;display:block;";

        const name = document.createElement("p");
        name.style.cssText = "font-weight:600;font-size:14px;margin:0 0 2px;";
        name.textContent = props.name;
        link.appendChild(name);

        const loc = document.createElement("p");
        loc.style.cssText = "font-size:12px;color:#64748b;margin:0;";
        loc.textContent = `${props.region}, ${props.country}`;
        link.appendChild(loc);

        if (props.difficulty || simCount > 0) {
          const meta = document.createElement("p");
          meta.style.cssText = "font-size:11px;color:#0369a1;margin:3px 0 0;text-transform:capitalize;";
          const parts: string[] = [];
          if (props.difficulty) parts.push(props.difficulty);
          if (simCount > 0) parts.push(`${simCount} comparison${simCount !== 1 ? "s" : ""}`);
          meta.textContent = parts.join(" · ");
          link.appendChild(meta);
        }

        if (siteTypes.length > 0) {
          const types = document.createElement("p");
          types.style.cssText = "font-size:11px;color:#64748b;margin:3px 0 0;text-transform:capitalize;";
          types.textContent = siteTypes.slice(0, 3).join(" · ");
          link.appendChild(types);
        }

        container.appendChild(link);

        // Rating section — always shown
        const ratingEl = buildRatingElement(
          props.id,
          rating,
          myVote,
          loggedInRef.current,
          (value) => voteOnSite(props.id, value),
        );
        container.appendChild(ratingEl);

        // Compare link
        const compareDiv = document.createElement("div");
        compareDiv.style.cssText = "margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;";
        const compareLink = document.createElement("a");
        compareLink.href = `/compare?from=${props.id}`;
        compareLink.style.cssText = "font-size:11px;color:#0369a1;text-decoration:none;font-weight:500;";
        compareLink.textContent = "+ Compare this site";
        compareDiv.appendChild(compareLink);
        container.appendChild(compareDiv);

        new mapboxgl.Popup({ closeButton: false, maxWidth: "240px" })
          .setLngLat(e.lngLat)
          .setDOMContent(container)
          .addTo(mapInstance);
      });

      // Cursor changes
      mapInstance.on("mouseenter", "clusters", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "clusters", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
      mapInstance.on("mouseenter", "unclustered-point", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "unclustered-point", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
    });

    if (interactive) {
      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
    };
  }, [center, zoom, interactive, handleClusterClick]);

  // Update source data when sites change
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    const source = mapInstance.getSource("sites") as mapboxgl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: sites.map((site) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [site.longitude, site.latitude],
        },
        properties: {
          id: site.id,
          name: site.name,
          slug: site.slug,
          country: site.country,
          region: site.region,
          difficulty: site.difficulty,
          siteTypes: JSON.stringify(site.siteTypes),
          hasRated: site.id in userVotesRef.current,
          hasCompared: !!userComparisonsRef.current[site.id],
        },
      })),
    });
  }, [sites]);

  // Search: filter visible pins + auto-navigate to results
  useEffect(() => {
    if (totalSites === undefined) return; // search only on the main map

    const timer = setTimeout(() => {
      const mapInstance = map.current;
      if (!mapInstance || !mapInstance.isStyleLoaded()) return;
      const source = mapInstance.getSource("sites") as mapboxgl.GeoJSONSource;
      if (!source) return;

      const q = searchQuery.trim();
      const allSites = sitesRef.current;

      const matched = q
        ? allSites.filter((s) => fuzzyMatch(q, s.name, s.country, s.region))
        : allSites;

      setMatchCount(matched.length);

      source.setData({
        type: "FeatureCollection",
        features: matched.map((site) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [site.longitude, site.latitude] },
          properties: {
            id: site.id,
            name: site.name,
            slug: site.slug,
            country: site.country,
            region: site.region,
            difficulty: site.difficulty,
            siteTypes: JSON.stringify(site.siteTypes),
            hasRated: site.id in userVotesRef.current,
            hasCompared: !!userComparisonsRef.current[site.id],
          },
        })),
      });

      if (!q || matched.length === 0) return;

      if (matched.length === 1) {
        mapInstance.flyTo({
          center: [matched[0].longitude, matched[0].latitude],
          zoom: 12,
          duration: 700,
        });
      } else {
        const lngs = matched.map((s) => s.longitude);
        const lats = matched.map((s) => s.latitude);
        mapInstance.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 80, maxZoom: matched.length <= 10 ? 10 : 6, duration: 700 }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, totalSites]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <p className="text-sm text-muted-foreground">
          Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="h-full w-full" />

      {/* Search overlay — only on the main map */}
      {totalSites !== undefined && (
        <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 w-72 sm:w-80 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 shadow-lg backdrop-blur pointer-events-auto">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dive sites…"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {matchCount.toLocaleString()} sites
              </span>
            )}
          </div>
          {searchQuery && (
            <p className="text-center text-xs text-muted-foreground mt-1.5 drop-shadow-sm">
              {matchCount === 0
                ? "No matches"
                : `${matchCount.toLocaleString()} result${matchCount === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
