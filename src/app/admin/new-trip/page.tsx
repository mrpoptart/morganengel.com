"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip } from "@/lib/trips";
import { uploadImage } from "@/lib/upload";
import { useAuth } from "@/components/AuthProvider";
import { SaveError, formatSaveError } from "@/components/SaveError";

export default function NewTripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    try {
      setCoverImage(await uploadImage(file));
    } catch (error) {
      console.error("Cover upload failed:", error);
    } finally {
      setUploadingCover(false);
    }
  }

  async function save(status: "draft" | "published") {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createTrip({
        title: title.trim(),
        description: description.trim(),
        status,
        ...(coverImage ? { coverImage } : {}),
        ...(user?.displayName || user?.email
          ? { author: user.displayName ?? user.email ?? undefined }
          : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save trip:", error);
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <SaveError message={saveError} />
      <input
        type="text"
        placeholder="Trip name..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-4 px-0 focus:outline-none"
      />

      <textarea
        placeholder="A short description of the trip..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="textarea textarea-ghost text-base w-full mb-4 px-0 focus:outline-none resize-y"
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
              onClick={() => setCoverImage(null)}
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
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <button
          onClick={() => save("draft")}
          disabled={saving || !title.trim()}
          className="btn btn-outline btn-sm"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : "Save Draft"}
        </button>
        <button
          onClick={() => save("published")}
          disabled={saving || !title.trim()}
          className="btn btn-primary btn-sm"
        >
          {saving ? <span className="loading loading-spinner loading-xs" /> : "Publish"}
        </button>
      </div>
    </div>
  );
}
