import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";

export default async function ProDashboardPage() {
  const profile = await getProfile();

  if (!profile || (profile.role !== "pro" && profile.role !== "admin")) {
    redirect("/");
  }

  let mySites: (typeof diveSites.$inferSelect)[] = [];
  try {
    mySites = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.createdBy, profile.id))
      .orderBy(desc(diveSites.createdAt));
  } catch {
    // DB not connected
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pro Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your dive sites
            </p>
          </div>
          <Link href="/pro/add-site">
            <Button>Add Site</Button>
          </Link>
        </div>

        {mySites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t added any dive sites yet.
              </p>
              <Link href="/pro/add-site">
                <Button className="mt-4">Add your first site</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {mySites.map((site) => (
              <Card key={site.id} className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between py-4">
                  <Link href={`/site/${site.slug}`} className="min-w-0 flex-1">
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {site.region}, {site.country}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {site.difficulty && (
                      <Badge variant="secondary" className="capitalize">
                        {site.difficulty}
                      </Badge>
                    )}
                    {site.accessType && (
                      <Badge variant="outline" className="capitalize">
                        {site.accessType}
                      </Badge>
                    )}
                    <Link href={`/pro/edit-site/${site.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
