"use client";

import { useState } from "react";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUpload } from "@/components/images/image-upload";
import type { Image } from "@/db/schema";

interface ComparisonImagesProps {
  similarityId: string;
  initialImages: Image[];
  canUpload: boolean;
}

export function ComparisonImages({
  similarityId,
  initialImages,
  canUpload,
}: ComparisonImagesProps) {
  const [imgs, setImgs] = useState(initialImages);

  function handleUploaded(image: { id: string; url: string; caption: string | null }) {
    setImgs((prev) => [
      ...prev,
      {
        ...image,
        thumbnailUrl: image.url,
        uploadedBy: "",
        diveSiteId: null,
        similarityId,
        createdAt: new Date(),
      },
    ]);
  }

  if (!canUpload && imgs.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <ImageGallery images={imgs} />
      {canUpload && (
        <ImageUpload similarityId={similarityId} onUploaded={handleUploaded} />
      )}
    </div>
  );
}
