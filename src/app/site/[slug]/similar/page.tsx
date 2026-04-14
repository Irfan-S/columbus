import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { diveSites, similarities, profiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NearbySites } from "@/components/sites/nearby-sites";
import { getNearbySites } from "@/lib/geo";
import type { Metadata } from "next";
import type { DiveSite } from "@/db/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [site] = await db.select().from(diveSites).where(eq(diveSites.slug, slug)).limit(1);
    if (!site) return {};
    return { title: `Sites similar to ${site.name} — Columbus` };
  } catch {
    return {};
  }
}

const AXES = [
  { key: "pelagicRating" as const, label: "Pelagic" },
  { key: "macroRating" as const, label: "Macro" },
  { key: "landscapeRating" as const, label: "Landscape" },
  { key: "currentsRating" as const, label: "Currents" },
  { key: "visibilityRating" as const, label: "Visibility" },
];

function avg(vals: number[]) {
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

export default async function SiteSimilarPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfile();

  let site: typeof diveSites.$inferSelect | undefined;
  try {
    const [result] = await db.select().from(diveSites).where(eq(diveSites.slug, slug)).limit(1);
    site = result;
  } catch {
    notFound();
  }
  if (!site) notFound();

  let nearbySites: { site: DiveSite; distanceM: number }[] = [];
  let rankedSites: {
    site: DiveSite;
    comparisonCount: number;
    axes: { key: string; label: string; avg: number }[];
    overallAvg: number;
  }[] = [];

  try {
    // Single join query — no N+1
    const siteATable = alias(diveSites, "site_a");
    const siteBTable = alias(diveSites, "site_b");

    const rows = await db
      .select({ similarity: similarities, siteA: siteATable, siteB: siteBTable, author: profiles })
      .from(similarities)
      .leftJoin(siteATable, eq(similarities.siteAId, siteATable.id))
      .leftJoin(siteBTable, eq(similarities.siteBId, siteBTable.id))
      .leftJoin(profiles, eq(similarities.createdBy, profiles.id))
      .where(or(eq(similarities.siteAId, site.id), eq(similarities.siteBId, site.id)));

    // Group by other site
    const bysite = new Map<string, { site: DiveSite; sims: typeof similarities.$inferSelect[] }>();

    for (const row of rows) {
      const otherSite = row.similarity.siteAId === site.id ? row.siteB : row.siteA;
      if (!otherSite) continue;
      if (!bysite.has(otherSite.id)) {
        bysite.set(otherSite.id, { site: otherSite, sims: [] });
      }
      bysite.get(otherSite.id)!.sims.push(row.similarity);
    }

    // Aggregate and rank
    rankedSites = Array.from(bysite.values()).map(({ site: s, sims }) => {
      const axes = AXES.flatMap((axis) => {
        const vals = sims.map((sim) => sim[axis.key]).filter((v): v is number => v !== null);
        const a = avg(vals);
        return a !== null ? [{ key: axis.key, label: axis.label, avg: Math.round(a * 10) / 10 }] : [];
      });
      const overallAvg = avg(axes.map((a) => a.avg)) ?? 0;
      return { site: s, comparisonCount: sims.length, axes, overallAvg };
    });

    // Sort by overall similarity descending
    rankedSites.sort((a, b) => b.overallAvg - a.overallAvg);
  } catch {
    // DB not connected
  }

  try {
    nearbySites = await getNearbySites(site.id, site.latitude, site.longitude);
  } catch {
    // ignore
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/site/${site.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {site.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Sites similar to {site.name}</h1>
          <p className="text-muted-foreground">{site.region}, {site.country}</p>
        </div>

        {nearbySites.length > 0 && (
          <div className="mb-8">
            <NearbySites sites={nearbySites} />
          </div>
        )}

        {rankedSites.length === 0 ? (
          <div className="rounded-lg border py-12 text-center">
            <p className="text-muted-foreground">No comparisons yet.</p>
            {profile && (
              <Link href={`/compare?from=${site.id}`}>
                <Button className="mt-4">Be the first to compare</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {rankedSites.length} similar site{rankedSites.length !== 1 ? "s" : ""} · ranked by similarity
              </p>
              {profile && (
                <Link href={`/compare?from=${site.id}`}>
                  <Button size="sm">Add Comparison</Button>
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {rankedSites.map(({ site: other, comparisonCount, axes, overallAvg }, i) => (
                <Card key={other.id} className="transition-colors hover:bg-accent/50">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-5">#{i + 1}</span>
                          <Link href={`/site/${other.slug}`} className="font-medium hover:underline truncate">
                            {other.name}
                          </Link>
                        </div>
                        <p className="ml-7 text-sm text-muted-foreground">
                          {other.region}, {other.country}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {overallAvg.toFixed(1)}<span className="text-xs text-muted-foreground font-normal">/5</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comparisonCount} comparison{comparisonCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Per-axis breakdown */}
                    <div className="mt-3 ml-7 flex flex-wrap gap-2">
                      {axes.map((axis) => (
                        <Badge key={axis.key} variant="secondary" className="text-xs font-normal">
                          {axis.label} {axis.avg}
                        </Badge>
                      ))}
                    </div>

                    {/* Badges */}
                    {(other.difficulty || other.siteTypes?.length) && (
                      <div className="mt-2 ml-7 flex flex-wrap gap-1.5">
                        {other.difficulty && (
                          <Badge variant="outline" className="capitalize text-xs">{other.difficulty}</Badge>
                        )}
                        {other.siteTypes?.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="capitalize text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
