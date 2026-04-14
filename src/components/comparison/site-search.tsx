"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (containerRef.current) {
      setDropdownRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sites/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const sites: DiveSite[] = await res.json();
          setResults(excludeSiteId ? sites.filter((s) => s.id !== excludeSiteId) : sites);
          updateRect();
          setIsOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, excludeSiteId, updateRect]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleScroll() {
      if (isOpen) updateRect();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateRect);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isOpen, updateRect]);

  const dropdownStyle = dropdownRect
    ? {
        position: "fixed" as const,
        top: dropdownRect.bottom + 4,
        left: dropdownRect.left,
        width: dropdownRect.width,
        zIndex: 9999,
      }
    : undefined;

  const dropdown =
    isOpen && dropdownStyle ? (
      results.length > 0 ? (
        <div style={dropdownStyle} className="rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(e) => e.preventDefault()}
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
      ) : query.length >= 2 && !loading ? (
        <div
          style={dropdownStyle}
          className="rounded-md border bg-popover px-3 py-4 text-center text-sm text-muted-foreground shadow-lg"
        >
          No sites found
        </div>
      ) : null
    ) : null;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => {
          if (results.length > 0) {
            updateRect();
            setIsOpen(true);
          }
        }}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
