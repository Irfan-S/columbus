"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  siteId: string;
  currentDescription: string;
}

type State = "idle" | "editing" | "submitting" | "done";

export function SuggestDescription({ siteId, currentDescription }: Props) {
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState(currentDescription);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleSubmit() {
    setError(null);
    setState("submitting");

    const res = await fetch(`/api/sites/${siteId}/suggest-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestedDescription: text }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit suggestion");
      setState("editing");
      return;
    }

    setState("done");
  }

  function handleCancel() {
    setText(currentDescription);
    setError(null);
    setState("idle");
  }

  if (state === "done") {
    return (
      <p className="text-sm text-muted-foreground">
        Suggestion submitted — an admin will review it shortly.
      </p>
    );
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("editing")}
        className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
      >
        Suggest an edit
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={state === "submitting"}
        className="text-sm"
      />
      <div className="flex items-center justify-between">
        <p className={`text-xs ${wordCount > 500 ? "text-destructive" : "text-muted-foreground"}`}>
          {wordCount}/500 words
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={state === "submitting"}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={state === "submitting" || wordCount > 500 || text.trim() === currentDescription.trim()}
          >
            {state === "submitting" ? "Submitting…" : "Submit suggestion"}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
