"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import type { DiveSite } from "@/db/schema";

interface SiteSearchProps {
  onSelect: (site: DiveSite) => void;
  excludeSiteId?: string;
  placeholder?: string;
}

export function SiteSearch({
  onSelect,
  excludeSiteId,
  placeholder = "Search dive sites...",
}: SiteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiveSite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sites/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const sites: DiveSite[] = await res.json();
          setResults(
            excludeSiteId
              ? sites.filter((s) => s.id !== excludeSiteId)
              : sites
          );
          setIsOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, excludeSiteId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent"
                  onClick={() => {
                    onSelect(site);
                    setQuery(site.name);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-sm font-medium">{site.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {site.region}, {site.country}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-4 text-center text-sm text-muted-foreground shadow-lg">
          No sites found
        </div>
      )}
    </div>
  );
}
