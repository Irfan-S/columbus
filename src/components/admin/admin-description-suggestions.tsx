"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteDescriptionSuggestion, DiveSite, Profile } from "@/db/schema";

interface Props {
  suggestions: {
    suggestion: SiteDescriptionSuggestion;
    site: DiveSite;
    author: Profile;
  }[];
}

function SuggestionRow({
  suggestion,
  site,
  author,
}: {
  suggestion: SiteDescriptionSuggestion;
  site: DiveSite;
  author: Profile;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: "approve" | "reject") {
    setError(null);
    setLoading(action);
    const res = await fetch(`/api/admin/${action}-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: suggestion.id }),
    });
    if (!res.ok) {
      setError("Something went wrong");
      setLoading(null);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{site.name}</p>
            <p className="text-xs text-muted-foreground">
              {site.region}, {site.country} · suggested by {author.displayName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Current</p>
            <p className="text-sm leading-relaxed">{suggestion.currentDescription}</p>
          </div>
          <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
            <p className="mb-1 text-xs font-medium text-primary uppercase tracking-wide">Suggested</p>
            <p className="text-sm leading-relaxed">{suggestion.suggestedDescription}</p>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive border-destructive/30"
            onClick={() => handle("reject")}
            disabled={!!loading}
          >
            {loading === "reject" ? "Rejecting…" : "Reject"}
          </Button>
          <Button
            size="sm"
            onClick={() => handle("approve")}
            disabled={!!loading}
          >
            {loading === "approve" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDescriptionSuggestions({ suggestions }: Props) {
  if (suggestions.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending suggestions.</p>;
  }

  return (
    <div className="space-y-4">
      {suggestions.map(({ suggestion, site, author }) => (
        <SuggestionRow key={suggestion.id} suggestion={suggestion} site={site} author={author} />
      ))}
    </div>
  );
}
