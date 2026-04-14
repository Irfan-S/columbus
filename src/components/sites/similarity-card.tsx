import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Similarity, DiveSite, Profile } from "@/db/schema";

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
          className={`h-2 w-2 rounded-full ${
            i <= value ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function SimilarityCard({
  similarity,
  otherSite,
  author,
}: {
  similarity: Similarity;
  otherSite: DiveSite;
  author: Profile;
}) {
  const activeAxes = AXES.filter(
    (axis) => similarity[axis.key] !== null
  );

  return (
    <Link href={`/compare/${similarity.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{otherSite.name}</p>
              <p className="text-sm text-muted-foreground">
                {otherSite.region}, {otherSite.country}
              </p>
            </div>
          </div>

          {/* Rating axes */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {activeAxes.map((axis) => (
              <div key={axis.key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">
                  {axis.label}
                </span>
                <RatingDots value={similarity[axis.key]!} />
              </div>
            ))}
          </div>

          {/* Note */}
          {similarity.note && (
            <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
              {similarity.note}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            by {author.displayName}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
