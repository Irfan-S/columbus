"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface PinPickerMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export function PinPickerMap({
  onLocationSelect,
  initialLat,
  initialLng,
}: PinPickerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [initialLng ?? 20, initialLat ?? 15],
      zoom: initialLat ? 10 : 2,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (initialLat && initialLng) {
      marker.current = new mapboxgl.Marker({ color: "#0369a1" })
        .setLngLat([initialLng, initialLat])
        .addTo(mapInstance);
    }

    mapInstance.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: "#0369a1" })
          .setLngLat([lng, lat])
          .addTo(mapInstance);
      }

      onLocationSelectRef.current(lat, lng);
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when coords change externally (typed in)
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || initialLat == null || initialLng == null) return;

    if (marker.current) {
      marker.current.setLngLat([initialLng, initialLat]);
    } else {
      marker.current = new mapboxgl.Marker({ color: "#0369a1" })
        .setLngLat([initialLng, initialLat])
        .addTo(mapInstance);
    }

    mapInstance.flyTo({
      center: [initialLng, initialLat],
      zoom: Math.max(mapInstance.getZoom(), 8),
      duration: 500,
    });
  }, [initialLat, initialLng]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md bg-muted">
        <p className="text-sm text-muted-foreground">
          Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="h-64 w-full rounded-md border overflow-hidden"
    />
  );
}
