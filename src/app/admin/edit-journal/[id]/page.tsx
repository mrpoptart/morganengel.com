"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getJournalById,
  getJournalBySlug,
  updateJournal,
  deleteJournal,
} from "@/lib/journal";
import { uploadImage } from "@/lib/upload";
import { extractGpsFromImage } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocode";
import { Editor } from "@/components/Editor";
import { TagsInput } from "@/components/TagsInput";
import { LocationPicker } from "@/components/LocationPicker";
import type { JournalEntry, GeoLocation } from "@/types/journal";

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const idOrSlug = params.id as string;

  const [entryId, setEntryId] = useState<string | null>(null);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const htmlRef = useRef("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      let e = await getJournalById(idOrSlug);
      if (!e) e = await getJournalBySlug(idOrSlug);
      if (!e) {
        router.push("/admin");
        return;
      }
      setEntryId(e.id);
      setEntry(e);
      setTitle(e.title);
      setSlug(e.slug);
      setTags(e.tags.join(", "));
      setCoverImage(e.coverImage ?? null);
      setLocation(e.location ?? null);
      if (e.publishedAt) {
        setPublishDate(e.publishedAt.toDate().toISOString().slice(0, 16));
      }
      htmlRef.current = e.content;
      setLoading(false);
      setTimeout(() => {
        loadedRef.current = true;
      }, 100);
    }
    load();
  }, [idOrSlug, router]);

  const triggerAutosave = useCallback(() => {
    if (!entryId || entry?.status === "published") return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setAutoSaved(false);
    autosaveTimer.current = setTimeout(async () => {
      await updateJournal(entryId, {
        title: title.trim(),
        slug: slug.trim(),
        content: htmlRef.current,
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        location,
        coverImage,
      });
      setAutoSaved(true);
    }, 2000);
  }, [entryId, entry?.status, title, slug, tags, location, coverImage]);

  // Autosave on field changes (drafts only).
  useEffect(() => {
    if (!loadedRef.current) return;
    triggerAutosave();
  }, [title, tags, location, coverImage, triggerAutosave]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const handleEditorUpdate = useCallback(
    (_json: unknown, html: string) => {
      htmlRef.current = html;
      if (loadedRef.current) triggerAutosave();
    },
    [triggerAutosave]
  );

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    setPhotoNote(null);
    try {
      // Pull GPS from the photo's EXIF and pin the map to it.
      const gps = await extractGpsFromImage(file);
      if (gps) {
        const label = await reverseGeocode(gps.lat, gps.lng);
        setLocation({ ...gps, label: label ?? undefined });
        setPhotoNote(
          label ? `📍 Location set from photo: ${label}` : "📍 Location set from photo."
        );
      } else {
        setPhotoNote(
          "This photo has no location data — set the location manually below."
        );
      }
      const url = await uploadImage(file);
      setCoverImage(url);
    } catch (error) {
      console.error("Cover upload failed:", error);
      setPhotoNote("Couldn't process that photo.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function save(status?: "draft" | "published") {
    if (!entryId) return;
    setSaving(true);
    try {
      await updateJournal(entryId, {
        title: title.trim(),
        slug: slug.trim(),
        content: htmlRef.current,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        location,
        coverImage,
        ...(status ? { status } : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entryId || !confirm(`Delete "${title}"?`)) return;
    await deleteJournal(entryId);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="animate-fade-in-up">
      <input
        type="text"
        placeholder="Journal title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-2 px-0 focus:outline-none"
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-base-content/40 font-mono">/journal/</span>
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

      <Editor initialHTML={entry.content} onUpdate={handleEditorUpdate} />

      <div className="flex gap-3 mt-6 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="btn btn-ghost btn-sm text-error"
          >
            Delete
          </button>
          {entry.status === "draft" && autoSaved && (
            <span className="text-xs text-base-content/40 font-mono">Saved</span>
          )}
        </div>
        <div className="flex gap-3">
          {entry.status === "published" ? (
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
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Update"
                )}
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
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Publish"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
