import Image from "next/image";
import { db } from "@/db";
import { diveSites, similarities } from "@/db/schema";
import { count } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { HomeMap } from "@/components/map/home-map";

export default async function HomePage() {
  const profile = await getProfile();

  let sites: (typeof diveSites.$inferSelect)[] = [];
  let similarityCounts: Record<string, number> = {};

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
  } catch {
    // DB not connected yet — show empty map
  }

  return (
    <div className="flex h-screen flex-col">
      <Header profile={profile} />
      <main className="relative flex-1">
        <HomeMap sites={sites} similarityCounts={similarityCounts} />

        {/* Logo overlay — visible when no sites / first visit */}
        {sites.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto text-center">
              <Image
                src="/logo-text-slogan.png"
                alt="Columbus — Dive Site Comparison Engine"
                width={320}
                height={180}
                className="mx-auto h-36 w-auto opacity-90 drop-shadow-lg sm:h-44"
                priority
              />
            </div>
          </div>
        )}

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
