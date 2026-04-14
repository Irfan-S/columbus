import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { diveSites, similarities, profiles, images, siteRatings } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteDetailMap } from "@/components/sites/site-detail-map";
import { SimilarityCard } from "@/components/sites/similarity-card";
import { AggregatedScores } from "@/components/sites/aggregated-scores";
import { SiteImages } from "@/components/sites/site-images";
import { NearbySites } from "@/components/sites/nearby-sites";
import { SuggestDescription } from "@/components/sites/suggest-description";
import { DiveAgainRating } from "@/components/sites/dive-again-rating";
import { getNearbySites } from "@/lib/geo";
import type { Metadata } from "next";
import type { DiveSite } from "@/db/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const [site] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.slug, slug))
      .limit(1);

    if (!site) return {};

    const title = `${site.name} — Columbus`;
    const description = site.description.slice(0, 160);
    const url = `https://columbusapp.io/site/${site.slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "Columbus",
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

export default async function SiteDetailPage({ params }: PageProps) {
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

  // Get similarities for this site — single query with joins
  let siteSimilarities: {
    similarity: typeof similarities.$inferSelect;
    otherSite: typeof diveSites.$inferSelect;
    author: typeof profiles.$inferSelect;
  }[] = [];

  try {
    const siteATable = alias(diveSites, "site_a");
    const siteBTable = alias(diveSites, "site_b");

    const rows = await db
      .select({ similarity: similarities, siteA: siteATable, siteB: siteBTable, author: profiles })
      .from(similarities)
      .leftJoin(siteATable, eq(similarities.siteAId, siteATable.id))
      .leftJoin(siteBTable, eq(similarities.siteBId, siteBTable.id))
      .leftJoin(profiles, eq(similarities.createdBy, profiles.id))
      .where(or(eq(similarities.siteAId, site.id), eq(similarities.siteBId, site.id)));

    for (const row of rows) {
      const otherSite = row.similarity.siteAId === site.id ? row.siteB : row.siteA;
      if (otherSite && row.author) {
        siteSimilarities.push({ similarity: row.similarity, otherSite, author: row.author });
      }
    }
  } catch {
    // DB not connected
  }

  // Get the pro who created this site
  let creator: typeof profiles.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, site.createdBy))
      .limit(1);
    creator = result;
  } catch {
    // ignore
  }

  // Get images for this site
  let siteImages: (typeof images.$inferSelect)[] = [];
  try {
    siteImages = await db
      .select()
      .from(images)
      .where(eq(images.diveSiteId, site.id));
  } catch {
    // ignore
  }

  // Get nearby sites (within 2km) — auto-detected by vicinity
  let nearbySites: { site: DiveSite; distanceM: number }[] = [];
  try {
    nearbySites = await getNearbySites(site.id, site.latitude, site.longitude);
  } catch {
    // ignore
  }

  // Get "would dive again" ratings
  let ratingYes = 0;
  let ratingNo = 0;
  let userRating: boolean | null = null;
  try {
    const allRatings = await db
      .select({ wouldDiveAgain: siteRatings.wouldDiveAgain, ratedBy: siteRatings.ratedBy })
      .from(siteRatings)
      .where(eq(siteRatings.siteId, site.id));
    ratingYes = allRatings.filter((r) => r.wouldDiveAgain).length;
    ratingNo = allRatings.filter((r) => !r.wouldDiveAgain).length;
    if (profile) {
      const myVote = allRatings.find((r) => r.ratedBy === profile.id);
      userRating = myVote ? myVote.wouldDiveAgain : null;
    }
  } catch {
    // ignore
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: site.name,
    description: site.description,
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.latitude,
      longitude: site.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: site.region,
      addressCountry: site.country,
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header profile={profile} />
      <main className="flex-1">
        {/* Map banner */}
        <div className="h-48 w-full sm:h-64">
          <SiteDetailMap
            latitude={site.latitude}
            longitude={site.longitude}
            name={site.name}
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Site header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-muted-foreground">
              {site.region}, {site.country}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {site.difficulty && (
                <Badge variant="secondary" className="capitalize">
                  {site.difficulty}
                </Badge>
              )}
              {site.accessType && (
                <Badge variant="outline" className="capitalize">
                  {site.accessType} access
                </Badge>
              )}
              {site.siteTypes?.map((type) => (
                <Badge key={type} variant="outline" className="capitalize">
                  {type}
                </Badge>
              ))}
              {site.maxDepthM && (
                <Badge variant="outline">{site.maxDepthM}m max depth</Badge>
              )}
              {site.typicalVisibilityM && (
                <Badge variant="outline">~{site.typicalVisibilityM}m visibility</Badge>
              )}
            </div>
          </div>

          {/* Image gallery */}
          <SiteImages
            siteId={site.id}
            initialImages={siteImages}
            canUpload={!!profile}
          />

          {/* Description */}
          <div className="mb-8">
            <p className="leading-relaxed text-foreground/90">{site.description}</p>
            {profile && (
              <div className="mt-2">
                <SuggestDescription siteId={site.id} currentDescription={site.description} />
              </div>
            )}
          </div>

          {creator && (
            <p className="mb-8 text-xs text-muted-foreground">
              Added by {creator.displayName} ({creator.certAgency}{" "}
              {creator.certLevel})
            </p>
          )}

          {/* Would dive again rating */}
          <div className="mb-8">
            <DiveAgainRating
              siteId={site.id}
              userRating={userRating}
              initialYes={ratingYes}
              initialNo={ratingNo}
              loggedIn={!!profile}
            />
          </div>

          {/* Nearby sites — auto-detected by vicinity */}
          {nearbySites.length > 0 && (
            <div className="mb-8">
              <NearbySites sites={nearbySites} />
            </div>
          )}

          {/* Similarities section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Similar Sites
                {siteSimilarities.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({siteSimilarities.length})
                  </span>
                )}
              </h2>
              {profile && (
                <Link href={`/compare?from=${site.id}`}>
                  <Button size="sm">Add Similarity</Button>
                </Link>
              )}
            </div>

            {/* Aggregated scores */}
            <AggregatedScores
              similarities={siteSimilarities.map((s) => s.similarity)}
            />

            {siteSimilarities.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No comparisons yet.{" "}
                    {profile
                      ? "Be the first to compare this site!"
                      : "Sign in to add a comparison."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {siteSimilarities.slice(0, 5).map(({ similarity, otherSite, author }) => (
                  <SimilarityCard
                    key={similarity.id}
                    similarity={similarity}
                    otherSite={otherSite}
                    author={author}
                  />
                ))}
                {siteSimilarities.length > 5 && (
                  <Link href={`/site/${site.slug}/similar`}>
                    <Button variant="outline" className="w-full">
                      View all {siteSimilarities.length} comparisons
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
