import type { Similarity } from "@/db/schema";

const AXES = [
  { key: "pelagicRating" as const, label: "Pelagic" },
  { key: "macroRating" as const, label: "Macro" },
  { key: "landscapeRating" as const, label: "Landscape" },
  { key: "currentsRating" as const, label: "Currents" },
  { key: "visibilityRating" as const, label: "Visibility" },
];

interface AggregatedScoresProps {
  similarities: Similarity[];
}

export function AggregatedScores({ similarities }: AggregatedScoresProps) {
  if (similarities.length === 0) return null;

  const aggregated = AXES.map((axis) => {
    const ratings = similarities
      .map((s) => s[axis.key])
      .filter((v): v is number => v !== null);

    if (ratings.length === 0) return null;

    const avg = ratings.reduce((sum, v) => sum + v, 0) / ratings.length;
    return { ...axis, avg: Math.round(avg * 10) / 10, count: ratings.length };
  }).filter(Boolean) as { key: string; label: string; avg: number; count: number }[];

  if (aggregated.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Average similarity across {similarities.length} comparison{similarities.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {aggregated.map((axis) => (
          <div key={axis.key} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{axis.label}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i <= Math.round(axis.avg) ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium">{axis.avg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
