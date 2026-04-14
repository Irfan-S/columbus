import { db } from "@/db";
import { diveSites, similarities, images } from "@/db/schema";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SiteList } from "@/components/sites/site-list";
import { count, eq } from "drizzle-orm";

export default async function SearchPage() {
  const profile = await getProfile();

  let sites: (typeof diveSites.$inferSelect)[] = [];
  let similarityCounts: Record<string, number> = {};
  let imageCounts: Record<string, number> = {};

  try {
    sites = await db.select().from(diveSites);

    // Count similarities per site (site appears as siteA or siteB)
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

    // Count images per site
    const imgCounts = await db
      .select({ siteId: images.diveSiteId, n: count() })
      .from(images)
      .where(eq(images.diveSiteId, images.diveSiteId)) // exclude null
      .groupBy(images.diveSiteId);

    for (const row of imgCounts) {
      if (row.siteId) {
        imageCounts[row.siteId] = Number(row.n);
      }
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Dive Sites</h1>
        <SiteList
          sites={sites}
          similarityCounts={similarityCounts}
          imageCounts={imageCounts}
        />
      </main>
    </div>
  );
}
