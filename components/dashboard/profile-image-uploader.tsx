"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type PreparedImage = {
  id: string;
  file: File;
  originalSize: number;
  previewUrl: string;
};

const maxDimension = 1600;
const compressionQuality = 0.82;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };

    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not optimize image."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      compressionQuality
    );
  });
}

async function optimizeImage(file: File) {
  if (file.type === "image/gif") {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-image";
  const optimized = new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now()
  });

  return optimized.size < file.size ? optimized : file;
}

export function ProfileImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  async function prepareFiles(files: FileList | null) {
    setError("");

    if (!files?.length) {
      setImages([]);
      return;
    }

    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      setError("Upload image files only.");
      setImages([]);
      return;
    }

    setIsOptimizing(true);

    try {
      const optimizedImages = await Promise.all(
        selectedFiles.map(async (file) => {
          const optimizedFile = await optimizeImage(file);

          return {
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            file: optimizedFile,
            originalSize: file.size,
            previewUrl: URL.createObjectURL(optimizedFile)
          };
        })
      );

      const transfer = new DataTransfer();
      optimizedImages.forEach((image) => transfer.items.add(image.file));

      if (inputRef.current) {
        inputRef.current.files = transfer.files;
      }

      setImages((previousImages) => {
        previousImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return optimizedImages;
      });
    } catch {
      setError("One of the images could not be optimized. Try a different file.");
      setImages([]);
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-medium">
        Add images
        <input
          ref={inputRef}
          accept="image/*"
          className="min-h-11 rounded-md border border-border bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
          multiple
          name="images"
          onChange={(event) => prepareFiles(event.currentTarget.files)}
          type="file"
        />
      </label>

      <p className="text-xs leading-5 text-muted-foreground">
        Images are optimized in your browser before upload. Large photos are resized to 1600px max and saved as lightweight WebP when possible.
      </p>

      {isOptimizing ? (
        <div className="rounded-md border border-border bg-white p-3 text-sm font-semibold">
          Optimizing images...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-semibold">
          {error}
        </div>
      ) : null}

      {images.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-md border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- Blob previews cannot be optimized by next/image. */}
              <img
                alt=""
                className="aspect-[4/3] w-full object-cover"
                src={image.previewUrl}
              />
              <div className="p-2 text-xs leading-5 text-muted-foreground">
                <p>{image.file.name}</p>
                <p>
                  {formatFileSize(image.originalSize)} to {formatFileSize(image.file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 md:w-fit"
        disabled={isOptimizing}
      >
        <ImagePlus size={16} />
        Upload images
      </button>
    </div>
  );
}
