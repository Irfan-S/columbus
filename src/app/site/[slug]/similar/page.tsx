import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { diveSites, similarities, profiles } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { SimilarityCard } from "@/components/sites/similarity-card";
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

export default async function SiteSimilarPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfile();

  let site: typeof diveSites.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.slug, slug))
      .limit(1);
    site = result;
  } catch {
    notFound();
  }

  if (!site) notFound();

  let nearbySites: { site: DiveSite; distanceM: number }[] = [];
  let siteSimilarities: {
    similarity: typeof similarities.$inferSelect;
    otherSite: typeof diveSites.$inferSelect;
    author: typeof profiles.$inferSelect;
  }[] = [];

  try {
    const rawSimilarities = await db
      .select()
      .from(similarities)
      .where(or(eq(similarities.siteAId, site.id), eq(similarities.siteBId, site.id)))
      .orderBy(desc(similarities.createdAt));

    for (const sim of rawSimilarities) {
      const otherSiteId = sim.siteAId === site.id ? sim.siteBId : sim.siteAId;

      const [otherSite] = await db
        .select()
        .from(diveSites)
        .where(eq(diveSites.id, otherSiteId))
        .limit(1);

      const [author] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, sim.createdBy))
        .limit(1);

      if (otherSite && author) {
        siteSimilarities.push({ similarity: sim, otherSite, author });
      }
    }
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
          <Link
            href={`/site/${site.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {site.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            Sites similar to {site.name}
          </h1>
          <p className="text-muted-foreground">
            {site.region}, {site.country}
          </p>
        </div>

        {nearbySites.length > 0 && (
          <div className="mb-8">
            <NearbySites sites={nearbySites} />
          </div>
        )}

        {siteSimilarities.length === 0 ? (
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
                {siteSimilarities.length} comparison{siteSimilarities.length !== 1 ? "s" : ""}
              </p>
              {profile && (
                <Link href={`/compare?from=${site.id}`}>
                  <Button size="sm">Add Similarity</Button>
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {siteSimilarities.map(({ similarity, otherSite, author }) => (
                <SimilarityCard
                  key={similarity.id}
                  similarity={similarity}
                  otherSite={otherSite}
                  author={author}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
