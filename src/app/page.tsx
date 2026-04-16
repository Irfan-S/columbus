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
          totalSites={sites.length}
        />

        {/* Pin colour legend — only meaningful when logged in */}
        {!!profile && (
          <div className="absolute bottom-20 sm:bottom-6 left-4 pointer-events-none">
            <div className="rounded-xl bg-background/90 px-3 py-2.5 shadow-lg backdrop-blur space-y-1.5">
              {(
                [
                  { bg: "#0369a1", label: "Not yet rated or compared" },
                  { bg: "#f59e0b", label: "Rated" },
                  { bg: "#0d9488", label: "Compared" },
                ] as const
              ).map(({ bg, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full ring-[1.5px] ring-white" style={{ background: bg }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-[1.5px] ring-white"
                  style={{ background: "linear-gradient(to right, #f59e0b 50%, #0d9488 50%)" }}
                />
                <span className="text-xs text-muted-foreground">Rated &amp; compared</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
