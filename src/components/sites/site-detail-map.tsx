"use client";

import { DiveMap } from "@/components/map/dive-map";

export function SiteDetailMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const fakeSite = {
    id: "detail",
    name,
    slug: "",
    description: "",
    latitude,
    longitude,
    country: "",
    region: "",
    difficulty: null,
    accessType: null,
    maxDepthM: null,
    siteTypes: null,
    createdBy: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as const;

  return (
    <DiveMap
      sites={[fakeSite as never]}
      interactive={false}
      center={[longitude, latitude]}
      zoom={10}
    />
  );
}
