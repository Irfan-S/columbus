import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { similarities, diveSites, profiles, images, similarityHistory } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComparisonImages } from "@/components/comparison/comparison-images";
import { AdminDeleteComparison } from "@/components/admin/admin-delete-comparison";
import { EditComparison } from "@/components/comparison/edit-comparison";
import { ComparisonHistory } from "@/components/comparison/comparison-history";
import type { SimilarityHistoryEntry, Profile } from "@/db/schema";

interface PageProps {
  params: Promise<{ id: string }>;
}

const AXES = [
  { key: "pelagicRating" as const, label: "Pelagic", desc: "Big marine life" },
  { key: "macroRating" as const, label: "Macro", desc: "Small creatures" },
  { key: "landscapeRating" as const, label: "Landscape", desc: "Topography" },
  { key: "currentsRating" as const, label: "Currents", desc: "Flow conditions" },
  { key: "visibilityRating" as const, label: "Visibility", desc: "Water clarity" },
];

function RatingBar({ value, label, desc }: { value: number; label: string; desc: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
          <span className="ml-2 text-xs text-muted-foreground">{desc}</span>
        </div>
        <span className="text-sm font-medium">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2.5 flex-1 rounded-full ${i <= value ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default async function CompareDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile();

  let similarity: typeof similarities.$inferSelect | undefined;
  let siteA: typeof diveSites.$inferSelect | undefined;
  let siteB: typeof diveSites.$inferSelect | undefined;
  let author: typeof profiles.$inferSelect | undefined;
  let comparisonImages: (typeof images.$inferSelect)[] = [];
  let history: SimilarityHistoryEntry[] = [];
  let editors: Record<string, Profile> = {};

  try {
    const [sim] = await db.select().from(similarities).where(eq(similarities.id, id)).limit(1);
    if (!sim) notFound();
    similarity = sim;

    const [a] = await db.select().from(diveSites).where(eq(diveSites.id, sim.siteAId)).limit(1);
    const [b] = await db.select().from(diveSites).where(eq(diveSites.id, sim.siteBId)).limit(1);
    const [u] = await db.select().from(profiles).where(eq(profiles.id, sim.createdBy)).limit(1);

    siteA = a;
    siteB = b;
    author = u;

    comparisonImages = await db.select().from(images).where(eq(images.similarityId, id));

    history = await db
      .select()
      .from(similarityHistory)
      .where(eq(similarityHistory.similarityId, id))
      .orderBy(asc(similarityHistory.createdAt));

    // Fetch unique editors for history entries
    const editorIds = [...new Set(history.map((h) => h.editedBy))];
    if (editorIds.length > 0) {
      const editorProfiles = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, editorIds[0])); // drizzle inList would be cleaner but keeping simple
      // fetch all editors individually and merge
      const allEditors = await Promise.all(
        editorIds.map((eid) =>
          db.select().from(profiles).where(eq(profiles.id, eid)).limit(1).then((r) => r[0])
        )
      );
      editors = Object.fromEntries(allEditors.filter(Boolean).map((e) => [e.id, e]));
    }
  } catch {
    notFound();
  }

  if (!similarity || !siteA || !siteB) notFound();

  const activeAxes = AXES.filter((axis) => similarity[axis.key] !== null);
  const canEdit =
    profile && (profile.id === similarity.createdBy || profile.role === "admin");

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">

        {/* Action bar — edit (creator/admin) + delete (admin only) */}
        {canEdit && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <EditComparison similarity={similarity} />
            {profile.role === "admin" && (
              <AdminDeleteComparison similarityId={similarity.id} />
            )}
          </div>
        )}

        {/* Admin-only delete when not the creator */}
        {!canEdit && profile?.role === "admin" && (
          <div className="mb-4 flex justify-end">
            <AdminDeleteComparison similarityId={similarity.id} />
          </div>
        )}

        {/* Site pair header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 text-lg">
            <Link href={`/site/${siteA.slug}`} className="font-semibold text-primary hover:underline">
              {siteA.name}
            </Link>
            <span className="text-muted-foreground">&</span>
            <Link href={`/site/${siteB.slug}`} className="font-semibold text-primary hover:underline">
              {siteB.name}
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteA.region}, {siteA.country} — {siteB.region}, {siteB.country}
          </p>
        </div>

        {/* Ratings card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Similarity Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAxes.map((axis) => (
              <RatingBar
                key={axis.key}
                value={similarity[axis.key]!}
                label={axis.label}
                desc={axis.desc}
              />
            ))}
          </CardContent>
        </Card>

        {/* Note */}
        {(similarity.note || author) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              {similarity.note && <p className="leading-relaxed">{similarity.note}</p>}
              {author && (
                <p className="mt-3 text-xs text-muted-foreground">
                  by {author.displayName} · {author.certAgency} {author.certLevel}
                  {history.length > 0 && ` · edited ${history.length} time${history.length !== 1 ? "s" : ""}`}
                </p>
              )}
              {/* Edit history inline */}
              <ComparisonHistory history={history} editors={editors} />
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        <ComparisonImages
          similarityId={similarity.id}
          initialImages={comparisonImages}
          canUpload={!!profile}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/site/${siteA.slug}`} className="flex-1">
            <Button variant="outline" className="w-full">View {siteA.name}</Button>
          </Link>
          <Link href={`/site/${siteB.slug}`} className="flex-1">
            <Button variant="outline" className="w-full">View {siteB.name}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
