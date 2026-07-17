"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/upload";

interface GalleryInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function GalleryInput({ value, onChange }: GalleryInputProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        uploaded.push(await uploadImage(file));
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } catch (error) {
      console.error("Gallery upload failed:", error);
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-base-content/10"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove photo"
                className="btn btn-xs btn-error absolute top-1 right-1"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move left"
                  className="btn btn-xs"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move right"
                  className="btn btn-xs"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="btn btn-outline btn-sm cursor-pointer">
        {uploading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : value.length ? (
          "Add more photos"
        ) : (
          "Add photos"
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
