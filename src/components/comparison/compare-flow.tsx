"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteSearch } from "./site-search";
import { StarRating } from "./star-rating";
import type { DiveSite } from "@/db/schema";

type Step = "select-sites" | "rate" | "submitting";

export function CompareFlow({
  initialSiteA,
}: {
  initialSiteA: DiveSite | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    initialSiteA ? "select-sites" : "select-sites"
  );
  const [error, setError] = useState<string | null>(null);

  const [siteA, setSiteA] = useState<DiveSite | null>(initialSiteA);
  const [siteB, setSiteB] = useState<DiveSite | null>(null);

  const [pelagic, setPelagic] = useState<number | null>(null);
  const [macro, setMacro] = useState<number | null>(null);
  const [landscape, setLandscape] = useState<number | null>(null);
  const [currents, setCurrents] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const hasRating =
    pelagic !== null ||
    macro !== null ||
    landscape !== null ||
    currents !== null ||
    visibility !== null;

  function handleProceedToRate() {
    setError(null);
    if (!siteA || !siteB) {
      setError("Select both sites");
      return;
    }
    setStep("rate");
  }

  async function handleSubmit() {
    setError(null);

    if (!hasRating) {
      setError("Rate at least one axis");
      return;
    }
    if (!note.trim()) {
      setError("Add a note explaining why these sites are similar");
      return;
    }
    if (wordCount > 100) {
      setError("Note must be 100 words or fewer");
      return;
    }

    setStep("submitting");

    try {
      const res = await fetch("/api/similarities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteAId: siteA!.id,
          siteBId: siteB!.id,
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
        setError(data.error || "Failed to submit comparison");
        setStep("rate");
        return;
      }

      const similarity = await res.json();
      router.push(`/compare/${similarity.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("rate");
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        <div
          className={`h-1.5 w-16 rounded-full ${
            step === "select-sites" ? "bg-primary" : "bg-primary/40"
          }`}
        />
        <div
          className={`h-1.5 w-16 rounded-full ${
            step === "rate" || step === "submitting"
              ? "bg-primary"
              : "bg-muted"
          }`}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === "select-sites" && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Dive Sites</CardTitle>
            <CardDescription>
              Pick two dive sites to compare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Site A */}
            <div className="space-y-2">
              <Label>First site</Label>
              {siteA ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="font-medium">{siteA.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {siteA.region}, {siteA.country}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSiteA(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <SiteSearch
                  onSelect={setSiteA}
                  excludeSiteId={siteB?.id}
                  placeholder="Search for the first site..."
                />
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">is similar to</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Site B */}
            <div className="space-y-2">
              <Label>Second site</Label>
              {siteB ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="font-medium">{siteB.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {siteB.region}, {siteB.country}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSiteB(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <SiteSearch
                  onSelect={setSiteB}
                  excludeSiteId={siteA?.id}
                  placeholder="Search for the second site..."
                />
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleProceedToRate}
              disabled={!siteA || !siteB}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {(step === "rate" || step === "submitting") && siteA && siteB && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              How similar are they?
            </CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">
                {siteA.name}
              </span>{" "}
              and{" "}
              <span className="font-medium text-foreground">
                {siteB.name}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating axes */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Rate similarity on each axis (at least one required, tap to
                rate, tap again to clear)
              </p>
              <StarRating
                label="Pelagic"
                value={pelagic}
                onChange={setPelagic}
              />
              <StarRating label="Macro" value={macro} onChange={setMacro} />
              <StarRating
                label="Landscape"
                value={landscape}
                onChange={setLandscape}
              />
              <StarRating
                label="Currents"
                value={currents}
                onChange={setCurrents}
              />
              <StarRating
                label="Visibility"
                value={visibility}
                onChange={setVisibility}
              />
            </div>

            {/* Active axes summary */}
            {hasRating && (
              <div className="flex flex-wrap gap-1">
                {pelagic && <Badge variant="secondary">Pelagic {pelagic}/5</Badge>}
                {macro && <Badge variant="secondary">Macro {macro}/5</Badge>}
                {landscape && <Badge variant="secondary">Landscape {landscape}/5</Badge>}
                {currents && <Badge variant="secondary">Currents {currents}/5</Badge>}
                {visibility && <Badge variant="secondary">Visibility {visibility}/5</Badge>}
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Why are these sites similar?
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Both have stunning wall dives with regular manta sightings and similar visibility..."
                rows={3}
              />
              <p
                className={`text-xs ${
                  wordCount > 100
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {wordCount}/100 words
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("select-sites")}
                disabled={step === "submitting"}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={
                  step === "submitting" || !hasRating || !note.trim()
                }
              >
                {step === "submitting"
                  ? "Submitting..."
                  : "Submit Comparison"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
