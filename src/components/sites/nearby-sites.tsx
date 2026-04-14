import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistance } from "@/lib/geo";
import type { DiveSite } from "@/db/schema";

interface NearbySitesProps {
  sites: { site: DiveSite; distanceM: number }[];
}

export function NearbySites({ sites }: NearbySitesProps) {
  if (sites.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Also at this location</h2>
        <Badge variant="secondary" className="text-xs font-normal">
          auto-detected
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {sites.length === 1
          ? "1 dive site within 2km"
          : `${sites.length} dive sites within 2km`}
      </p>

      <div className="space-y-2">
        {sites.map(({ site, distanceM }) => (
          <Link key={site.id} href={`/site/${site.slug}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{site.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {site.region}, {site.country}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(distanceM)}
                  </span>
                  {site.difficulty && (
                    <Badge variant="outline" className="capitalize">
                      {site.difficulty}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
