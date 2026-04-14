"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import type { Similarity } from "@/db/schema";

interface Props {
  similarity: Similarity;
}

export function EditComparison({ similarity }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pelagic, setPelagic] = useState<number | null>(similarity.pelagicRating);
  const [macro, setMacro] = useState<number | null>(similarity.macroRating);
  const [landscape, setLandscape] = useState<number | null>(similarity.landscapeRating);
  const [currents, setCurrents] = useState<number | null>(similarity.currentsRating);
  const [visibility, setVisibility] = useState<number | null>(similarity.visibilityRating);
  const [note, setNote] = useState(similarity.note ?? "");

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const hasRating = pelagic !== null || macro !== null || landscape !== null || currents !== null || visibility !== null;

  function handleCancel() {
    // Reset to original values
    setPelagic(similarity.pelagicRating);
    setMacro(similarity.macroRating);
    setLandscape(similarity.landscapeRating);
    setCurrents(similarity.currentsRating);
    setVisibility(similarity.visibilityRating);
    setNote(similarity.note ?? "");
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setError(null);
    if (!hasRating) {
      setError("Rate at least one axis");
      return;
    }
    if (wordCount > 100) {
      setError("Note must be 100 words or fewer");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/similarities/${similarity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pelagicRating: pelagic,
          macroRating: macro,
          landscapeRating: landscape,
          currentsRating: currents,
          visibilityRating: visibility,
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Edit comparison
      </Button>
    );
  }

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Edit Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tap a rating to change it, tap the same dot to clear it
          </p>
          <StarRating label="Pelagic" value={pelagic} onChange={setPelagic} />
          <StarRating label="Macro" value={macro} onChange={setMacro} />
          <StarRating label="Landscape" value={landscape} onChange={setLandscape} />
          <StarRating label="Currents" value={currents} onChange={setCurrents} />
          <StarRating label="Visibility" value={visibility} onChange={setVisibility} />
        </div>

        {hasRating && (
          <div className="flex flex-wrap gap-1">
            {pelagic && <Badge variant="secondary">Pelagic {pelagic}/5</Badge>}
            {macro && <Badge variant="secondary">Macro {macro}/5</Badge>}
            {landscape && <Badge variant="secondary">Landscape {landscape}/5</Badge>}
            {currents && <Badge variant="secondary">Currents {currents}/5</Badge>}
            {visibility && <Badge variant="secondary">Visibility {visibility}/5</Badge>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-note">
            Why are these sites similar?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="edit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Both have stunning wall dives with regular manta sightings..."
            rows={3}
          />
          <p className={`text-xs ${wordCount > 100 ? "text-destructive" : "text-muted-foreground"}`}>
            {wordCount}/100 words
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading || !hasRating}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
