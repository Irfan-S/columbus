"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProRequestButton({
  hasPendingRequest,
}: {
  hasPendingRequest: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(hasPendingRequest);

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Pro request submitted — we&apos;ll review it shortly.
      </p>
    );
  }

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/pro/request", { method: "POST" });
      if (res.ok) {
        setSubmitted(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleRequest} disabled={loading}>
      {loading ? "Submitting..." : "Request Pro Status"}
    </Button>
  );
}
