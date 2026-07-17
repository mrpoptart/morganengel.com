"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getTripById,
  getTripBySlug,
  updateTrip,
  deleteTrip,
} from "@/lib/trips";
import { uploadImage } from "@/lib/upload";
import type { Trip } from "@/types/trip";

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const idOrSlug = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let t = await getTripById(idOrSlug);
      if (!t) t = await getTripBySlug(idOrSlug);
      if (!t) {
        router.push("/admin");
        return;
      }
      setTrip(t);
      setTripId(t.id);
      setTitle(t.title);
      setSlug(t.slug);
      setDescription(t.description ?? "");
      setCoverImage(t.coverImage ?? null);
      if (t.publishedAt) {
        setPublishDate(t.publishedAt.toDate().toISOString().slice(0, 16));
      }
      setLoading(false);
    }
    load();
  }, [idOrSlug, router]);

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

  async function save(status?: "draft" | "published") {
    if (!tripId) return;
    setSaving(true);
    try {
      await updateTrip(tripId, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        coverImage,
        ...(status ? { status } : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save trip:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!tripId || !confirm(`Delete "${title}"? Entries in it will be kept.`)) return;
    await deleteTrip(tripId);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="animate-fade-in-up">
      <input
        type="text"
        placeholder="Trip name..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-2 px-0 focus:outline-none"
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-base-content/40 font-mono">/trips/</span>
        {editingSlug ? (
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setEditingSlug(false)}
            autoFocus
            className="input input-ghost input-xs font-mono px-0 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingSlug(true)}
            className="text-xs font-mono text-base-content/50 hover:text-primary transition-colors"
          >
            {slug} ✏️
          </button>
        )}
      </div>

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

      <div className="flex gap-3 mt-6 justify-between">
        <button onClick={handleDelete} className="btn btn-ghost btn-sm text-error">
          Delete
        </button>
        <div className="flex gap-3">
          {trip.status === "published" ? (
            <>
              <button
                onClick={() => save("draft")}
                disabled={saving}
                className="btn btn-outline btn-sm"
              >
                Unpublish
              </button>
              <button
                onClick={() => save("published")}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? <span className="loading loading-spinner loading-xs" /> : "Update"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => save("draft")}
                disabled={saving}
                className="btn btn-outline btn-sm"
              >
                Save Draft
              </button>
              <button
                onClick={() => save("published")}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? <span className="loading loading-spinner loading-xs" /> : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
