"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DiveSite } from "@/db/schema";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface DiveMapProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
  heroImages?: Record<string, string>;
  ratingData?: Record<string, { yes: number; no: number }>;
  loggedIn?: boolean;
  userVotes?: Record<string, boolean>;
  onSiteClick?: (site: DiveSite) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function buildRatingHtml(
  siteId: string,
  rating: { yes: number; no: number } | undefined,
  myVote: boolean | null,
  loggedIn: boolean,
): string {
  const yes = rating?.yes ?? 0;
  const no = rating?.no ?? 0;
  const total = yes + no;
  const pct = total > 0 ? Math.round((yes / total) * 100) : 0;

  const bar =
    total > 0
      ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
           <span style="font-size:11px;color:#64748b;">Would dive again</span>
           <span style="font-size:12px;font-weight:600;color:#0369a1;">${pct}%</span>
         </div>
         <div style="height:4px;background:#e5e7eb;border-radius:9999px;overflow:hidden;">
           <div style="height:100%;width:${pct}%;background:#0369a1;border-radius:9999px;"></div>
         </div>
         <p style="font-size:10px;color:#94a3b8;margin:3px 0 0;">${total} rating${total !== 1 ? "s" : ""}</p>`
      : "";

  const heading =
    total === 0
      ? `<p style="font-size:11px;color:#64748b;margin:0 0 5px;font-weight:500;">Would you dive here again?</p>`
      : bar;

  if (!loggedIn) {
    return `<div style="margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;">
      ${total > 0 ? bar : `<p style="font-size:11px;color:#94a3b8;margin:0;">No ratings yet</p>`}
    </div>`;
  }

  if (myVote !== null) {
    const changeValue = !myVote;
    const changeLabel = myVote ? "No" : "Yes";
    return `<div id="popup-rating-${siteId}" style="margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;">
      ${bar}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:${total > 0 ? "5px" : "0"};">
        <span style="font-size:11px;color:#64748b;">Your vote: <strong style="color:${myVote ? "#0369a1" : "#dc2626"}">${myVote ? "Yes" : "No"}</strong></span>
        <button onclick="window.__columbusVote('${siteId}',${changeValue})" style="font-size:10px;color:#64748b;border:1px solid #e5e7eb;background:#f8fafc;border-radius:4px;padding:2px 7px;cursor:pointer;">Switch to ${changeLabel}</button>
      </div>
    </div>`;
  }

  return `<div id="popup-rating-${siteId}" style="margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;">
    ${heading}
    <div style="display:flex;gap:6px;margin-top:${total > 0 ? "6px" : "0"};">
      <button onclick="window.__columbusVote('${siteId}',true)" style="flex:1;font-size:11px;color:#0369a1;border:1px solid #bae6fd;background:#f0f9ff;border-radius:4px;padding:4px 0;cursor:pointer;font-weight:500;">👍 Yes</button>
      <button onclick="window.__columbusVote('${siteId}',false)" style="flex:1;font-size:11px;color:#dc2626;border:1px solid #fecaca;background:#fff5f5;border-radius:4px;padding:4px 0;cursor:pointer;font-weight:500;">👎 No</button>
    </div>
  </div>`;
}

export function DiveMap({
  sites,
  similarityCounts = {},
  heroImages = {},
  ratingData = {},
  loggedIn = false,
  userVotes = {},
  onSiteClick,
  interactive = true,
  center = [20, 15],
  zoom = 1.8,
  className = "h-full w-full",
}: DiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
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

    // Global vote handler for popup buttons
    (window as Window & { __columbusVote?: (siteId: string, value: boolean) => void }).__columbusVote = async (
      siteId: string,
      value: boolean,
    ) => {
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
          // Update live refs so reopening popup shows fresh data
          ratingDataRef.current = { ...ratingDataRef.current, [siteId]: data };
          userVotesRef.current = { ...userVotesRef.current, [siteId]: value };
          const el2 = document.getElementById(`popup-rating-${siteId}`);
          if (el2) {
            el2.outerHTML = buildRatingHtml(siteId, data, value, true);
          }
        }
      } catch {
        if (el) el.style.opacity = "1";
      }
    };

    mapInstance.on("load", () => {
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

      // Individual site markers
      mapInstance.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "sites",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0369a1", // sky-700
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
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

        const simText = simCount > 0
          ? `<span style="font-size:11px;color:#64748b;">${simCount} comparison${simCount !== 1 ? "s" : ""}</span>`
          : "";

        const siteTypes: string[] = props.siteTypes ? JSON.parse(props.siteTypes) : [];
        const typeText = siteTypes.length > 0
          ? `<p style="font-size:11px;color:#64748b;margin:3px 0 0;text-transform:capitalize;">${siteTypes.slice(0, 3).join(" · ")}</p>`
          : "";

        const ratingHtml = buildRatingHtml(props.id, rating, myVote, loggedInRef.current);

        new mapboxgl.Popup({ closeButton: false, maxWidth: "220px" })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;font-size:13px;">
              ${heroImg ? `<img src="${heroImg}" style="width:100%;height:72px;object-fit:cover;border-radius:4px;margin-bottom:6px;display:block;" />` : ""}
              <a href="/site/${props.slug}" style="text-decoration:none;color:inherit;display:block;">
                <p style="font-weight:600;font-size:14px;margin:0 0 2px;">${props.name}</p>
                <p style="font-size:12px;color:#64748b;margin:0;">${props.region}, ${props.country}</p>
                ${props.difficulty ? `<p style="font-size:11px;color:#0369a1;margin:3px 0 0;text-transform:capitalize;">${props.difficulty}${simText ? " · " + simText : ""}</p>` : simText ? `<p style="margin:3px 0 0;">${simText}</p>` : ""}
                ${typeText}
              </a>
              ${ratingHtml}
              <div style="margin-top:7px;padding-top:7px;border-top:1px solid #e5e7eb;">
                <a href="/compare?from=${props.id}" style="font-size:11px;color:#0369a1;text-decoration:none;font-weight:500;">+ Compare this site</a>
              </div>
            </div>`
          )
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
        },
      })),
    });
  }, [sites]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-muted`}
      >
        <p className="text-sm text-muted-foreground">
          Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map
        </p>
      </div>
    );
  }

  return <div ref={mapContainer} className={className} />;
}
