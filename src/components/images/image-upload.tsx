"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  diveSiteId?: string;
  similarityId?: string;
  onUploaded?: (image: { id: string; url: string; caption: string | null }) => void;
}

export function ImageUpload({
  diveSiteId,
  similarityId,
  onUploaded,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (diveSiteId) formData.append("diveSiteId", diveSiteId);
      if (similarityId) formData.append("similarityId", similarityId);
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const image = await res.json();
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded?.(image);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="text-sm"
      />
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Add photo"}
        </Button>
        <span className="text-xs text-muted-foreground">
          JPEG, PNG, WebP. Max 5MB.
        </span>
      </div>
    </div>
  );
}
