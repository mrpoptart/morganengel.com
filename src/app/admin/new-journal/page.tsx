"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createJournal } from "@/lib/journal";
import { uploadImage } from "@/lib/upload";
import { Editor } from "@/components/Editor";
import { TagsInput } from "@/components/TagsInput";
import { LocationPicker } from "@/components/LocationPicker";
import { GalleryInput } from "@/components/GalleryInput";
import type { GeoLocation } from "@/types/journal";
import type { JSONContent } from "novel";

export default function NewJournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const htmlRef = useRef("");

  const handleEditorUpdate = useCallback((_json: JSONContent, html: string) => {
    htmlRef.current = html;
  }, []);

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    setPhotoNote(null);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch (error) {
      console.error("Cover upload failed:", error);
      setPhotoNote("Couldn't upload that photo.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function save(status: "draft" | "published") {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createJournal({
        title: title.trim(),
        content: htmlRef.current,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        status,
        location,
        gallery,
        ...(coverImage ? { coverImage } : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <input
        type="text"
        placeholder="Journal title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-4 px-0 focus:outline-none"
      />

      <TagsInput
        value={tags}
        onChange={setTags}
        className="input input-ghost text-sm font-mono w-full mb-4 px-0 text-base-content/50 focus:outline-none"
      />

      <div className="flex items-center gap-2 mb-6">
        <label className="text-xs text-base-content/40 font-mono">Publish date:</label>
        <input
          type="datetime-local"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          className="input input-ghost input-sm font-mono text-sm text-base-content/50 focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <label className="text-xs text-base-content/40 font-mono block mb-2">
          Cover photo
        </label>
        {coverImage ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover"
              className="max-h-48 rounded-lg border border-base-content/10"
            />
            <button
              type="button"
              onClick={() => {
                setCoverImage(null);
                setPhotoNote(null);
              }}
              className="btn btn-xs btn-error absolute top-2 right-2"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="btn btn-outline btn-sm cursor-pointer">
            {uploadingCover ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Upload cover photo"
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleCoverFile(e.target.files?.[0])}
            />
          </label>
        )}
        {photoNote && (
          <p className="text-xs text-base-content/50 font-mono mt-2">{photoNote}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="text-xs text-base-content/40 font-mono block mb-2">
          Location
        </label>
        <LocationPicker value={location} onChange={setLocation} />
      </div>

      <Editor onUpdate={handleEditorUpdate} />

      <div className="mt-6">
        <label className="text-xs text-base-content/40 font-mono block mb-2">
          Gallery
        </label>
        <GalleryInput value={gallery} onChange={setGallery} />
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <button
          onClick={() => save("draft")}
          disabled={saving || !title.trim()}
          className="btn btn-outline btn-sm"
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Save Draft"
          )}
        </button>
        <button
          onClick={() => save("published")}
          disabled={saving || !title.trim()}
          className="btn btn-primary btn-sm"
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Publish"
          )}
        </button>
      </div>
    </div>
  );
}
