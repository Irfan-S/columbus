"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/db/schema";

export function AdminProRequests({ requests }: { requests: Profile[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No pending pro requests
        </CardContent>
      </Card>
    );
  }

  async function handleApprove(userId: string) {
    setLoading(userId + "-approve");
    try {
      await fetch("/api/admin/approve-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDeny(userId: string) {
    setLoading(userId + "-deny");
    try {
      await fetch("/api/admin/deny-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {requests.map((user) => (
        <Card key={user.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.displayName}</p>
                  <Badge variant="outline" className="shrink-0">
                    {user.certAgency}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {user.certLevel} · #{user.certNumber}
                </p>
                {user.proRequestedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested{" "}
                    {new Date(user.proRequestedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeny(user.id)}
                  disabled={loading !== null}
                >
                  {loading === user.id + "-deny" ? "Denying..." : "Deny"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(user.id)}
                  disabled={loading !== null}
                >
                  {loading === user.id + "-approve" ? "Approving..." : "Approve"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
