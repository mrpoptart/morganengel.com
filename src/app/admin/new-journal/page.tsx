"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJournal } from "@/lib/journal";
import { uploadImage } from "@/lib/upload";
import { uploadInlineImages } from "@/lib/uploadInlineImages";
import { Editor } from "@/components/Editor";
import { TagsInput } from "@/components/TagsInput";
import { LocationPicker } from "@/components/LocationPicker";
import { GalleryInput } from "@/components/GalleryInput";
import { TripSelect } from "@/components/TripSelect";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { formatSaveError } from "@/components/SaveError";
import type { GeoLocation } from "@/types/journal";
import type { JSONContent } from "novel";

// Local backup key. A new entry has no server document until the first save, so
// we continuously stash the in-progress draft here — it survives refresh, tab
// close, and navigation, and is restored when the page reopens.
const LOCAL_KEY = "unsaved:new-journal";

export default function NewJournalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [tripId, setTripId] = useState("");
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [initialHTML, setInitialHTML] = useState<string | undefined>(undefined);
  const htmlRef = useRef("");
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Restore any locally-backed-up draft before rendering the editor.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.title) setTitle(d.title);
        if (d.tags) setTags(d.tags);
        if (d.publishDate) setPublishDate(d.publishDate);
        if (d.location) setLocation(d.location);
        if (Array.isArray(d.gallery)) setGallery(d.gallery);
        if (d.tripId) setTripId(d.tripId);
        if (d.coverImage) setCoverImage(d.coverImage);
        if (d.content) {
          htmlRef.current = d.content;
          setInitialHTML(d.content);
        }
        if (d.title || d.content) setRestored(true);
      }
    } catch {
      // Corrupt backup — ignore and start fresh.
    }
    setHydrated(true);
  }, []);

  const scheduleLocalSave = useCallback(() => {
    dirtyRef.current = true;
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      const hasContent =
        title.trim() || htmlRef.current.trim() || gallery.length > 0 || !!coverImage;
      if (!hasContent) return;
      try {
        localStorage.setItem(
          LOCAL_KEY,
          JSON.stringify({
            title,
            tags,
            publishDate,
            location,
            gallery,
            tripId,
            coverImage,
            content: htmlRef.current,
          })
        );
      } catch {
        // Storage full or unavailable — nothing else we can do here.
      }
    }, 800);
  }, [title, tags, publishDate, location, gallery, tripId, coverImage]);

  // Back up on any field change (once restored, so we don't overwrite before load).
  useEffect(() => {
    if (hydrated) scheduleLocalSave();
  }, [
    title,
    tags,
    publishDate,
    location,
    gallery,
    tripId,
    coverImage,
    hydrated,
    scheduleLocalSave,
  ]);

  // Warn before leaving with an unsaved draft.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(
    () => () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    },
    []
  );

  const handleEditorUpdate = useCallback(
    (_json: JSONContent, html: string) => {
      htmlRef.current = html;
      if (hydrated) scheduleLocalSave();
    },
    [hydrated, scheduleLocalSave]
  );

  function clearLocalBackup() {
    if (localTimer.current) clearTimeout(localTimer.current);
    dirtyRef.current = false;
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      // ignore
    }
  }

  function discardDraft() {
    clearLocalBackup();
    window.location.reload();
  }

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
    setSaveError(null);
    try {
      await createJournal({
        title: title.trim(),
        content: await uploadInlineImages(htmlRef.current),
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        status,
        location,
        gallery,
        tripId: tripId || null,
        ...(coverImage ? { coverImage } : {}),
        ...(user?.displayName || user?.email
          ? { author: user.displayName ?? user.email ?? undefined }
          : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      clearLocalBackup();
      showToast(status === "published" ? "Published" : "Draft saved");
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {saveError && (
        <div className="alert alert-error text-sm mb-4 font-mono break-all">
          <span>Save failed — {saveError}</span>
        </div>
      )}
      {restored && (
        <div className="alert text-sm mb-4">
          <span>Restored your unsaved draft.</span>
          <button onClick={discardDraft} className="btn btn-xs btn-ghost">
            Discard
          </button>
        </div>
      )}
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

      <div className="flex items-center gap-2 mb-6">
        <label className="text-xs text-base-content/40 font-mono">Trip:</label>
        <TripSelect value={tripId} onChange={setTripId} />
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

      <Editor initialHTML={initialHTML} onUpdate={handleEditorUpdate} />

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
