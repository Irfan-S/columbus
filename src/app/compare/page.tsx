import { redirect } from "next/navigation";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { CompareFlow } from "@/components/comparison/compare-flow";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?callbackUrl=/compare");

  const params = await searchParams;
  let siteA: (typeof diveSites.$inferSelect) | null = null;

  if (params.from) {
    try {
      const [result] = await db
        .select()
        .from(diveSites)
        .where(eq(diveSites.id, params.from))
        .limit(1);
      siteA = result ?? null;
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <CompareFlow initialSiteA={siteA} />
      </main>
    </div>
  );
}
