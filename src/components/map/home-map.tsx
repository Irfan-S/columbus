"use client";

import { DiveMap } from "./dive-map";
import type { DiveSite } from "@/db/schema";

interface HomeMapProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
}

export function HomeMap({ sites, similarityCounts = {} }: HomeMapProps) {
  return <DiveMap sites={sites} similarityCounts={similarityCounts} />;
}
