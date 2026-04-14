"use client";

import { useState } from "react";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUpload } from "@/components/images/image-upload";
import type { Image } from "@/db/schema";

interface SiteImagesProps {
  siteId: string;
  initialImages: Image[];
  canUpload: boolean;
}

export function SiteImages({ siteId, initialImages, canUpload }: SiteImagesProps) {
  const [imgs, setImgs] = useState(initialImages);

  function handleUploaded(image: { id: string; url: string; caption: string | null }) {
    setImgs((prev) => [
      ...prev,
      {
        ...image,
        thumbnailUrl: image.url,
        uploadedBy: "",
        diveSiteId: siteId,
        similarityId: null,
        createdAt: new Date(),
      },
    ]);
  }

  return (
    <div className="mb-6 space-y-3">
      <ImageGallery images={imgs} />
      {canUpload && (
        <ImageUpload diveSiteId={siteId} onUploaded={handleUploaded} />
      )}
    </div>
  );
}
