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
  onSiteClick?: (site: DiveSite) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function DiveMap({
  sites,
  similarityCounts = {},
  heroImages = {},
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

        const simText = simCount > 0
          ? `<span style="font-size:11px;color:#64748b;">${simCount} comparison${simCount !== 1 ? "s" : ""}</span>`
          : "";

        const siteTypes: string[] = props.siteTypes ? JSON.parse(props.siteTypes) : [];
        const typeText = siteTypes.length > 0
          ? `<p style="font-size:11px;color:#64748b;margin:3px 0 0;text-transform:capitalize;">${siteTypes.slice(0, 3).join(" · ")}</p>`
          : "";

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
