"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Image as ImageType } from "@/db/schema";

interface ImageGalleryProps {
  images: ImageType[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {images.map((img) => (
        <Dialog key={img.id}>
          <DialogTrigger className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-md border bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            <Image
              src={img.url}
              alt={img.caption || "Dive site photo"}
              fill
              className="object-cover"
              sizes="128px"
            />
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <div className="relative aspect-video w-full">
              <Image
                src={img.url}
                alt={img.caption || "Dive site photo"}
                fill
                className="object-contain bg-black"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
            {img.caption && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                {img.caption}
              </p>
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
