"use client";

import { DiveMap } from "./dive-map";
import type { DiveSite } from "@/db/schema";

interface HomeMapProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
  heroImages?: Record<string, string>;
}

export function HomeMap({ sites, similarityCounts = {}, heroImages = {} }: HomeMapProps) {
  return <DiveMap sites={sites} similarityCounts={similarityCounts} heroImages={heroImages} />;
}
