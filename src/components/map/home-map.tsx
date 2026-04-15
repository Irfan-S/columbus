"use client";

import { DiveMap } from "./dive-map";
import type { DiveSite } from "@/db/schema";

interface HomeMapProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
  heroImages?: Record<string, string>;
  ratingData?: Record<string, { yes: number; no: number }>;
  loggedIn?: boolean;
  userVotes?: Record<string, boolean>;
  userComparisons?: Record<string, boolean>;
}

export function HomeMap({ sites, similarityCounts = {}, heroImages = {}, ratingData = {}, loggedIn = false, userVotes = {}, userComparisons = {} }: HomeMapProps) {
  return <DiveMap sites={sites} similarityCounts={similarityCounts} heroImages={heroImages} ratingData={ratingData} loggedIn={loggedIn} userVotes={userVotes} userComparisons={userComparisons} />;
}
