import { db } from "@/db";
import { diveSites, similarities, images, siteRatings } from "@/db/schema";
import { count, isNotNull, eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { HomeMap } from "@/components/map/home-map";

export default async function HomePage() {
  const profile = await getProfile();

  let sites: (typeof diveSites.$inferSelect)[] = [];
  const similarityCounts: Record<string, number> = {};
  const heroImages: Record<string, string> = {};
  const ratingData: Record<string, { yes: number; no: number }> = {};
  const userVotes: Record<string, boolean> = {};
  const userComparisons: Record<string, boolean> = {};

  try {
    sites = await db.select().from(diveSites);

    const simCountsA = await db
      .select({ siteId: similarities.siteAId, n: count() })
      .from(similarities)
      .groupBy(similarities.siteAId);

    const simCountsB = await db
      .select({ siteId: similarities.siteBId, n: count() })
      .from(similarities)
      .groupBy(similarities.siteBId);

    for (const row of [...simCountsA, ...simCountsB]) {
      similarityCounts[row.siteId] = (similarityCounts[row.siteId] ?? 0) + Number(row.n);
    }

    // First image per site for map popup thumbnails
    const siteImageRows = await db
      .select({ diveSiteId: images.diveSiteId, url: images.url })
      .from(images)
      .where(isNotNull(images.diveSiteId))
      .orderBy(images.createdAt);

    for (const row of siteImageRows) {
      if (row.diveSiteId && !heroImages[row.diveSiteId]) {
        heroImages[row.diveSiteId] = row.url;
      }
    }

    // Rating counts per site + current user's votes
    const allRatings = await db
      .select({ siteId: siteRatings.siteId, wouldDiveAgain: siteRatings.wouldDiveAgain, ratedBy: siteRatings.ratedBy })
      .from(siteRatings);
    for (const r of allRatings) {
      if (!ratingData[r.siteId]) ratingData[r.siteId] = { yes: 0, no: 0 };
      if (r.wouldDiveAgain) ratingData[r.siteId].yes++;
      else ratingData[r.siteId].no++;
      if (profile && r.ratedBy === profile.id) {
        userVotes[r.siteId] = r.wouldDiveAgain;
      }
    }

    if (profile) {
      const userSims = await db
        .select({ siteAId: similarities.siteAId, siteBId: similarities.siteBId })
        .from(similarities)
        .where(eq(similarities.createdBy, profile.id));
      for (const row of userSims) {
        userComparisons[row.siteAId] = true;
        userComparisons[row.siteBId] = true;
      }
    }
  } catch {
    // DB not connected yet — show empty map
  }

  return (
    <div className="flex h-screen flex-col">
      <Header profile={profile} />
      <main className="relative flex-1">
        <HomeMap
          sites={sites}
          similarityCounts={similarityCounts}
          heroImages={heroImages}
          ratingData={ratingData}
          loggedIn={!!profile}
          userVotes={userVotes}
          userComparisons={userComparisons}
        />

        {/* Site count pill */}
        <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="rounded-full bg-background/90 px-4 py-2 shadow-lg backdrop-blur pointer-events-auto">
            <p className="text-sm text-muted-foreground">
              {sites.length > 0
                ? `${sites.length} dive site${sites.length === 1 ? "" : "s"} worldwide`
                : "Explore dive sites worldwide"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
