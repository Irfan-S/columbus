import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, siteDescriptionSuggestions, diveSites } from "@/db/schema";
import { desc, isNotNull, eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { AdminProRequests } from "@/components/admin/admin-pro-requests";
import { AdminUserRow } from "@/components/admin/admin-user-row";
import { AdminDescriptionSuggestions } from "@/components/admin/admin-description-suggestions";
import { Badge } from "@/components/ui/badge";
import type { SiteDescriptionSuggestion, DiveSite, Profile } from "@/db/schema";

export default async function AdminPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  let pendingRequests: (typeof profiles.$inferSelect)[] = [];
  let allUsers: (typeof profiles.$inferSelect)[] = [];
  let pendingSuggestions: { suggestion: SiteDescriptionSuggestion; site: DiveSite; author: Profile }[] = [];

  try {
    pendingRequests = await db
      .select()
      .from(profiles)
      .where(isNotNull(profiles.proRequestedAt))
      .orderBy(desc(profiles.proRequestedAt));

    allUsers = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt));

    const rawSuggestions = await db
      .select({ suggestion: siteDescriptionSuggestions, site: diveSites, author: profiles })
      .from(siteDescriptionSuggestions)
      .leftJoin(diveSites, eq(siteDescriptionSuggestions.siteId, diveSites.id))
      .leftJoin(profiles, eq(siteDescriptionSuggestions.suggestedBy, profiles.id))
      .where(eq(siteDescriptionSuggestions.status, "pending"))
      .orderBy(desc(siteDescriptionSuggestions.createdAt));

    pendingSuggestions = rawSuggestions.flatMap((r) =>
      r.site && r.author ? [{ suggestion: r.suggestion, site: r.site, author: r.author }] : []
    );
  } catch {
    // DB not connected
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header profile={profile} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage pro requests and users</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{allUsers.length}</p>
            <p className="text-sm text-muted-foreground">Total users</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold">
              {allUsers.filter((u) => u.role === "pro").length}
            </p>
            <p className="text-sm text-muted-foreground">Pro accounts</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {pendingRequests.length}
            </p>
            <p className="text-sm text-muted-foreground">Pro requests</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {pendingSuggestions.length}
            </p>
            <p className="text-sm text-muted-foreground">Edit suggestions</p>
          </div>
        </div>

        {/* Description suggestions */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">
            Description Edit Suggestions
            {pendingSuggestions.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">
                {pendingSuggestions.length}
              </Badge>
            )}
          </h2>
          <AdminDescriptionSuggestions suggestions={pendingSuggestions} />
        </section>

        {/* Pro requests */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">
            Pro Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">
                {pendingRequests.length}
              </Badge>
            )}
          </h2>

          <AdminProRequests requests={pendingRequests} />
        </section>

        {/* All users */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">All Users</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Cert</th>
                  <th className="px-4 py-2 text-left font-medium">Role</th>
                  <th className="px-4 py-2 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <AdminUserRow
                    key={user.id}
                    user={user}
                    currentAdminId={profile.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
