"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiveSite } from "@/db/schema";

const SITE_TYPES = [
  "wall", "reef", "wreck", "cave", "drift", "muck", "pinnacle", "shore", "deep",
];

type SortOption = "name" | "recent" | "most-compared";

interface SiteListProps {
  sites: DiveSite[];
  similarityCounts?: Record<string, number>;
  imageCounts?: Record<string, number>;
}

export function SiteList({ sites, similarityCounts = {}, imageCounts = {} }: SiteListProps) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [accessType, setAccessType] = useState<string>("");
  const [siteType, setSiteType] = useState<string>("");
  const [hasImages, setHasImages] = useState(false);
  const [sort, setSort] = useState<SortOption>("most-compared");

  const hasFilters = difficulty || accessType || siteType || hasImages;

  const filtered = useMemo(() => {
    let result = sites.filter((site) => {
      if (query) {
        const q = query.toLowerCase();
        const matches =
          site.name.toLowerCase().includes(q) ||
          site.country.toLowerCase().includes(q) ||
          site.region.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (difficulty && site.difficulty !== difficulty) return false;
      if (accessType && site.accessType !== accessType) return false;
      if (siteType && !site.siteTypes?.includes(siteType)) return false;
      if (hasImages && !imageCounts[site.id]) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "most-compared") {
        return (similarityCounts[b.id] ?? 0) - (similarityCounts[a.id] ?? 0);
      }
      return 0;
    });

    return result;
  }, [sites, query, difficulty, accessType, siteType, hasImages, sort, similarityCounts, imageCounts]);

  function clearFilters() {
    setDifficulty("");
    setAccessType("");
    setSiteType("");
    setHasImages(false);
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <Input
        placeholder="Search by name, country, or region..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Filters + sort row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accessType} onValueChange={(v) => setAccessType(v ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shore">Shore</SelectItem>
            <SelectItem value="boat">Boat</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>

        <Select value={siteType} onValueChange={(v) => setSiteType(v ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {SITE_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={hasImages ? "default" : "outline"}
          size="sm"
          onClick={() => setHasImages((v) => !v)}
          className="text-sm"
        >
          Has photos
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filtered.length} site{filtered.length !== 1 ? "s" : ""}
          </span>
          <Select value={sort} onValueChange={(v) => setSort((v ?? "most-compared") as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="most-compared">Most compared</SelectItem>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {sites.length === 0
            ? "No dive sites yet. Pros can add the first one!"
            : "No sites match your search."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((site) => {
            const simCount = similarityCounts[site.id] ?? 0;
            const imgCount = imageCounts[site.id] ?? 0;
            return (
              <Link key={site.id} href={`/site/${site.slug}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {site.region}, {site.country}
                      </p>
                      {(simCount > 0 || imgCount > 0) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {simCount > 0 && `${simCount} comparison${simCount !== 1 ? "s" : ""}`}
                          {simCount > 0 && imgCount > 0 && " · "}
                          {imgCount > 0 && `${imgCount} photo${imgCount !== 1 ? "s" : ""}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {site.difficulty && (
                        <Badge variant="secondary" className="capitalize">
                          {site.difficulty}
                        </Badge>
                      )}
                      {site.accessType && (
                        <Badge variant="outline" className="capitalize">
                          {site.accessType}
                        </Badge>
                      )}
                      {site.siteTypes?.slice(0, 2).map((type) => (
                        <Badge key={type} variant="outline" className="capitalize">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
