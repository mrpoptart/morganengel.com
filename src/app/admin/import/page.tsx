"use client";

import { useState } from "react";
import Link from "next/link";
import { TripSelect } from "@/components/TripSelect";
import { useAuth } from "@/components/AuthProvider";

interface Preview {
  title: string;
  dateText: string | null;
  dateISO: string | null;
  imageCount: number;
  contentPreview: string;
  contentLength: number;
}

export default function ImportPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [tripId, setTripId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function doPreview() {
    setError(null);
    setResult(null);
    setPreview(null);
    if (!url.trim()) return;
    setPreviewing(true);
    try {
      const res = await fetch(`/api/import-preview?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewing(false);
    }
  }

  async function doImport() {
    setError(null);
    setResult(null);
    if (!url.trim() || !user) return;
    setImporting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/import-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim(), tripId: tripId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      if (data.skipped) {
        setResult(`Skipped: ${data.reason}`);
      } else {
        setResult(
          `Imported "${data.title}" (${data.imageCount} photo${
            data.imageCount === 1 ? "" : "s"
          }). View at /journal/${data.slug}`
        );
        setUrl("");
        setPreview(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="animate-fade-in-up max-w-3xl">
      <h1 className="text-3xl font-mono font-bold mb-2">Import a post</h1>
      <p className="text-sm text-base-content/50 mb-6">
        Paste a single post&apos;s <code>web.archive.org</code> link, preview it,
        then import it into a trip. Nothing is saved until you tap Import.
      </p>

      <label className="text-xs text-base-content/40 font-mono block mb-1">
        Archive URL
      </label>
      <input
        type="url"
        placeholder="https://web.archive.org/web/…/http://www.meneli.com/…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="input input-bordered input-sm font-mono text-sm w-full mb-4"
      />

      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-base-content/40 font-mono">Trip:</label>
        <TripSelect value={tripId} onChange={setTripId} />
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={doPreview}
          disabled={previewing || !url.trim()}
          className="btn btn-outline btn-sm"
        >
          {previewing ? <span className="loading loading-spinner loading-xs" /> : "Preview"}
        </button>
        <button
          onClick={doImport}
          disabled={importing || !preview}
          className="btn btn-primary btn-sm"
        >
          {importing ? <span className="loading loading-spinner loading-xs" /> : "Import"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}
      {result && (
        <div className="alert alert-success text-sm mb-4">
          <span>{result}</span>
        </div>
      )}

      {preview && (
        <div className="border border-base-content/10 rounded-xl p-4 bg-base-200/30">
          <div className="text-xs font-mono text-base-content/50 mb-2 space-y-1">
            <div>
              <span className="text-base-content/40">Title:</span> {preview.title}
            </div>
            <div>
              <span className="text-base-content/40">Date:</span>{" "}
              {preview.dateISO
                ? new Date(preview.dateISO).toLocaleDateString()
                : preview.dateText ?? "— (will use today; edit after import)"}
            </div>
            <div>
              <span className="text-base-content/40">Photos:</span> {preview.imageCount}
            </div>
            <div>
              <span className="text-base-content/40">Content:</span> {preview.contentLength} chars
            </div>
          </div>
          <div className="divider my-2 text-xs">preview</div>
          <div
            className="prose prose-invert prose-sm max-w-none prose-blog max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: preview.contentPreview }}
          />
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-mono text-base-content/40 hover:text-primary">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
