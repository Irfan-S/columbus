import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { similarities, diveSites, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProRequestButton } from "@/components/profile/pro-request-button";

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?callbackUrl=/profile");

  // Get user's comparisons
  let userComparisons: {
    similarity: typeof similarities.$inferSelect;
    siteA: typeof diveSites.$inferSelect;
    siteB: typeof diveSites.$inferSelect;
  }[] = [];

  try {
    const userSimilarities = await db
      .select()
      .from(similarities)
      .where(eq(similarities.createdBy, profile.id))
      .orderBy(desc(similarities.createdAt));

    for (const sim of userSimilarities) {
      const [siteA] = await db
        .select()
        .from(diveSites)
        .where(eq(diveSites.id, sim.siteAId))
        .limit(1);
      const [siteB] = await db
        .select()
        .from(diveSites)
        .where(eq(diveSites.id, sim.siteBId))
        .limit(1);

      if (siteA && siteB) {
        userComparisons.push({ similarity: sim, siteA, siteB });
      }
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Profile header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">
            {profile.certAgency} {profile.certLevel}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {profile.role}
            </Badge>
            <Badge variant="outline">
              {userComparisons.length} comparison{userComparisons.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Pro request section for regular divers */}
          {profile.role === "diver" && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">Want to add dive sites?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pro accounts can create and curate dive sites on Columbus. If
                you&apos;re a dive professional, request access below.
              </p>
              <div className="mt-3">
                <ProRequestButton hasPendingRequest={!!profile.proRequestedAt} />
              </div>
            </div>
          )}
        </div>

        {/* Comparisons */}
        <h2 className="mb-4 text-lg font-semibold">My Comparisons</h2>

        {userComparisons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t made any comparisons yet.
              </p>
              <Link
                href="/compare"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Compare your first dive sites
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {userComparisons.map(({ similarity, siteA, siteB }) => (
              <Link key={similarity.id} href={`/compare/${similarity.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{siteA.name}</span>
                      <span className="text-muted-foreground">&</span>
                      <span className="font-medium">{siteB.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {similarity.note}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
