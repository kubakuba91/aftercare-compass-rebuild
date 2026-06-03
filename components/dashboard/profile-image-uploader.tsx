"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";

type PreparedImage = {
  id: string;
  file: File;
  originalSize: number;
  previewUrl: string;
};

type PhotoLimit = number | "unlimited";

const maxDimension = 1600;
const compressionQuality = 0.82;
const maxOriginalImageSize = 25 * 1024 * 1024;
const maxUploadImageSize = 10 * 1024 * 1024;

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

export function ProfileImageUploader({
  inputFormId,
  showSubmitButton = true,
  currentImageCount = 0,
  photoLimit = 12
}: {
  inputFormId?: string;
  showSubmitButton?: boolean;
  currentImageCount?: number;
  photoLimit?: PhotoLimit;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [error, setError] = useState("");
  const hasUnlimitedPhotos = photoLimit === "unlimited";
  const totalSelectedCount = currentImageCount + images.length;
  const isOverPhotoLimit = !hasUnlimitedPhotos && totalSelectedCount > photoLimit;
  const canSelectMoreImages = hasUnlimitedPhotos || currentImageCount < photoLimit;
  const galleryLimitText = hasUnlimitedPhotos
    ? `${totalSelectedCount} uploaded or selected. Unlimited photo gallery on this plan.`
    : `${totalSelectedCount} of ${photoLimit} photos uploaded or selected.`;

  function syncInputFiles(nextImages: PreparedImage[]) {
    if (!inputRef.current) {
      return;
    }

    if (!nextImages.length) {
      inputRef.current.value = "";
      return;
    }

    const transfer = new DataTransfer();
    nextImages.forEach((image) => transfer.items.add(image.file));
    inputRef.current.files = transfer.files;
  }

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  async function prepareFiles(files: FileList | null) {
    setError("");

    if (!files?.length) {
      setImages([]);
      syncInputFiles([]);
      return;
    }

    const selectedFiles = Array.from(files);
    const availableSlots =
      photoLimit === "unlimited" ? null : Math.max(photoLimit - currentImageCount, 0);

    if (availableSlots !== null && selectedFiles.length > availableSlots) {
      setError(
        availableSlots > 0
          ? `Your current plan has room for ${availableSlots} more photo${availableSlots === 1 ? "" : "s"}.`
          : "Your current plan photo gallery is full. Remove a photo or upgrade to add more."
      );
      setImages([]);
      syncInputFiles([]);
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      setError("Upload image files only.");
      setImages([]);
      syncInputFiles([]);
      return;
    }

    const oversizedOriginalFile = selectedFiles.find((file) => file.size > maxOriginalImageSize);

    if (oversizedOriginalFile) {
      setError(
        `${oversizedOriginalFile.name} is ${formatFileSize(oversizedOriginalFile.size)}. Upload photos up to ${formatFileSize(maxOriginalImageSize)}.`
      );
      setImages([]);
      syncInputFiles([]);
      return;
    }

    setIsOptimizing(true);

    try {
      const optimizedImages = await Promise.all(
        selectedFiles.map(async (file) => {
          const optimizedFile = await optimizeImage(file);

          if (optimizedFile.size > maxUploadImageSize) {
            throw new Error(`${file.name} is still too large after optimization.`);
          }

          return {
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            file: optimizedFile,
            originalSize: file.size,
            previewUrl: URL.createObjectURL(optimizedFile)
          };
        })
      );

      syncInputFiles(optimizedImages);

      setImages((previousImages) => {
        previousImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return optimizedImages;
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? `${uploadError.message} Try a smaller image or export it as JPG/WebP before uploading.`
          : "One of the images could not be optimized. Try a smaller image."
      );
      setImages([]);
      syncInputFiles([]);
    } finally {
      setIsOptimizing(false);
    }
  }

  function openPicker() {
    setIsOpen(true);
    setError("");
  }

  function closePicker() {
    setIsOpen(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!canSelectMoreImages || isOptimizing) {
      return;
    }
    prepareFiles(event.dataTransfer.files);
  }

  function removePreparedImage(imageId: string) {
    setImages((currentImages) => {
      const nextImages = currentImages.filter((image) => image.id !== imageId);
      const removedImage = currentImages.find((image) => image.id === imageId);

      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      syncInputFiles(nextImages);
      return nextImages;
    });
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        accept="image/*"
        className="sr-only"
        disabled={!canSelectMoreImages || isOptimizing}
        form={inputFormId}
        multiple
        name="images"
        onChange={(event) => prepareFiles(event.currentTarget.files)}
        type="file"
      />

      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <ImagePlus size={26} />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Add profile photos</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Choose photos, preview them, then upload. Large photos are optimized before they are saved.
        </p>
        <button
          className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#121b57] px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSelectMoreImages || isOptimizing}
          onClick={openPicker}
          type="button"
        >
          <ImagePlus size={17} />
          Add Photos
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
          {galleryLimitText}
        </span>
        {!canSelectMoreImages ? (
          <span className="inline-flex min-h-8 items-center rounded-full border border-accent/30 bg-accent/10 px-3 text-xs font-semibold text-foreground">
            Remove a photo or upgrade to add more.
          </span>
        ) : null}
      </div>
      {!canSelectMoreImages ? (
        <p className="sr-only">Remove a photo or upgrade to add more.</p>
      ) : null}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6"
          role="dialog"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold">Upload profile photos</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Drag and drop photos, or browse from your device.
                </p>
              </div>
              <button
                aria-label="Close photo upload"
                className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-border"
                onClick={closePicker}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-5 py-5">
              <div
                className="rounded-lg border-2 border-dashed border-primary/35 bg-primary/5 p-8 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <UploadCloud size={30} />
                </div>
                <p className="mt-4 text-lg font-semibold">Drag and drop</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Upload photos up to {formatFileSize(maxOriginalImageSize)}. Large photos are resized automatically.
                </p>
                <button
                  className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canSelectMoreImages || isOptimizing}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  Browse
                </button>
              </div>

              {isOptimizing ? (
                <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm font-semibold">
                  Optimizing images...
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-semibold">
                  {error}
                </div>
              ) : null}

              {images.length ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {images.length} selected photo{images.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground">{galleryLimitText}</p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {images.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-md border border-border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Blob previews cannot be optimized by next/image. */}
                        <img
                          alt=""
                          className="aspect-[4/3] w-full object-cover"
                          src={image.previewUrl}
                        />
                        <div className="grid gap-2 p-3 text-xs leading-5 text-muted-foreground">
                          <div>
                            <p className="truncate font-semibold text-foreground">{image.file.name}</p>
                            <p>
                              {formatFileSize(image.originalSize)} to {formatFileSize(image.file.size)}
                            </p>
                          </div>
                          <button
                            className="focus-ring inline-flex min-h-8 w-fit items-center gap-1 rounded-md border border-border px-2 font-semibold text-destructive"
                            onClick={() => removePreparedImage(image.id)}
                            type="button"
                          >
                            <X size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <button
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold shadow-sm"
                onClick={closePicker}
                type="button"
              >
                Cancel
              </button>
              {showSubmitButton ? (
                <button
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#121b57] px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isOptimizing || isOverPhotoLimit || !images.length}
                  form={inputFormId}
                >
                  <UploadCloud size={16} />
                  Upload
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
