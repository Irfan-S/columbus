import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";
import { EditSiteForm } from "@/components/sites/edit-site-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSitePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile();

  if (!profile || (profile.role !== "pro" && profile.role !== "admin")) {
    redirect("/");
  }

  let site: typeof diveSites.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, id))
      .limit(1);
    site = result;
  } catch {
    notFound();
  }

  if (!site) notFound();

  // Pros can only edit their own sites; admins can edit any
  if (profile.role !== "admin" && site.createdBy !== profile.id) {
    redirect("/pro/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <EditSiteForm site={site} />
    </div>
  );
}
