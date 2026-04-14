"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PinPickerMap } from "@/components/map/pin-picker-map";

const SITE_TYPES = [
  "wall",
  "reef",
  "wreck",
  "cave",
  "drift",
  "muck",
  "pinnacle",
  "shore",
  "deep",
];

export default function AddSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Required fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  // Optional fields
  const [difficulty, setDifficulty] = useState("");
  const [accessType, setAccessType] = useState("");
  const [maxDepthM, setMaxDepthM] = useState("");
  const [typicalVisibilityM, setTypicalVisibilityM] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const handleLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to get country/region
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country,region&access_token=${token}`
        );
        const data = await res.json();

        if (data.features) {
          const regionFeature = data.features.find(
            (f: { place_type: string[] }) => f.place_type.includes("region")
          );
          const countryFeature = data.features.find(
            (f: { place_type: string[] }) => f.place_type.includes("country")
          );

          if (regionFeature) setRegion(regionFeature.text);
          if (countryFeature) setCountry(countryFeature.text);
        }
      } catch {
        // Geocoding failed — user can fill in manually
      }
    },
    []
  );

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !description || latitude === null || longitude === null) {
      setError("Name, description, and map pin are required");
      return;
    }
    if (!country || !region) {
      setError("Country and region are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          latitude,
          longitude,
          country,
          region,
          difficulty: difficulty || null,
          accessType: accessType || null,
          maxDepthM: maxDepthM ? parseFloat(maxDepthM) : null,
          typicalVisibilityM: typicalVisibilityM ? parseFloat(typicalVisibilityM) : null,
          siteTypes: selectedTypes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create site");
        return;
      }

      const site = await res.json();
      router.push(`/site/${site.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Dive Site</CardTitle>
          <CardDescription>
            Pin a new dive site on the map. Only name, description, and location
            are required.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Site name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Richelieu Rock"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this site special? Conditions, marine life, experience..."
                rows={4}
                required
              />
            </div>

            {/* Map pin + manual coords */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <PinPickerMap
                onLocationSelect={handleLocationSelect}
                initialLat={latitude ?? undefined}
                initialLng={longitude ?? undefined}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={latitude ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      setLatitude(val);
                      if (val !== null && longitude !== null) {
                        handleLocationSelect(val, longitude);
                      }
                    }}
                    placeholder="e.g. 9.3625"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={longitude ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      setLongitude(val);
                      if (latitude !== null && val !== null) {
                        handleLocationSelect(latitude, val);
                      }
                    }}
                    placeholder="e.g. 98.0246"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the map or type coordinates directly
              </p>
            </div>

            {/* Country / Region (auto-filled from geocode) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Auto-filled from pin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Auto-filled from pin"
                  required
                />
              </div>
            </div>

            {/* Optional fields */}
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Optional details
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">
                        Intermediate
                      </SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access</Label>
                  <Select value={accessType} onValueChange={(v) => setAccessType(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shore">Shore</SelectItem>
                      <SelectItem value="boat">Boat</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDepth">Max depth (m)</Label>
                  <Input
                    id="maxDepth"
                    type="number"
                    value={maxDepthM}
                    onChange={(e) => setMaxDepthM(e.target.value)}
                    placeholder="e.g. 30"
                    min={0}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Typical visibility (m)</Label>
                  <Input
                    id="visibility"
                    type="number"
                    value={typicalVisibilityM}
                    onChange={(e) => setTypicalVisibilityM(e.target.value)}
                    placeholder="e.g. 20"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Site type</Label>
                <div className="flex flex-wrap gap-2">
                  {SITE_TYPES.map((type) => (
                    <Badge
                      key={type}
                      variant={
                        selectedTypes.includes(type) ? "default" : "outline"
                      }
                      className="cursor-pointer capitalize"
                      onClick={() => toggleType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating site..." : "Add dive site"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
