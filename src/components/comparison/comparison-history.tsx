"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SimilarityHistoryEntry, Profile } from "@/db/schema";

const AXES = [
  { key: "pelagicRating" as const, label: "Pelagic" },
  { key: "macroRating" as const, label: "Macro" },
  { key: "landscapeRating" as const, label: "Landscape" },
  { key: "currentsRating" as const, label: "Currents" },
  { key: "visibilityRating" as const, label: "Visibility" },
];

function RatingDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i <= value ? "bg-primary/60" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function HistoryEntry({
  entry,
  editor,
  label,
}: {
  entry: SimilarityHistoryEntry;
  editor: Profile | undefined;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeAxes = AXES.filter((a) => entry[a.key] !== null);
  const date = new Date(entry.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="border-l-2 border-muted pl-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {date}
            {editor ? ` · saved by ${editor.displayName}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "Show"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {activeAxes.map((axis) => (
              <div key={axis.key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">{axis.label}</span>
                <RatingDots value={entry[axis.key]!} />
                <span className="text-xs text-muted-foreground">{entry[axis.key]}/5</span>
              </div>
            ))}
          </div>
          {entry.note && (
            <p className="text-sm text-muted-foreground italic">"{entry.note}"</p>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  history: SimilarityHistoryEntry[];
  editors: Record<string, Profile>;
}

export function ComparisonHistory({ history, editors }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Edit history · {history.length} revision{history.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-4">
        {history.map((entry, i) => (
          <HistoryEntry
            key={entry.id}
            entry={entry}
            editor={editors[entry.editedBy]}
            label={`Version ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
