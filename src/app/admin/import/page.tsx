"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { TripSelect } from "@/components/TripSelect";

interface BlogPost {
  slug: string;
  title: string;
  permalink: string;
  dateISO: string;
  imageCount: number;
  tags: string[];
}

type PostState = "idle" | "importing" | "created" | "skipped" | "error";

export default function ImportPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tripId, setTripId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, { state: PostState; msg?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notesRunning, setNotesRunning] = useState(false);
  const [notesResult, setNotesResult] = useState<string | null>(null);

  async function loadPosts() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/import-preview?allposts=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPosts(data.posts as BlogPost[]);
      setSelected(new Set());
      setStatuses({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function toggle(permalink: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permalink)) next.delete(permalink);
      else next.add(permalink);
      return next;
    });
  }

  async function importSelected() {
    if (!user || !tripId) return;
    setImporting(true);
    setError(null);
    const toImport = posts.filter((p) => selected.has(p.permalink));
    for (const p of toImport) {
      setStatuses((s) => ({ ...s, [p.permalink]: { state: "importing" } }));
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/import-post", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            url: p.permalink,
            tripId,
            tags: ["travel", ...p.tags],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [p.permalink]: { state: "error", msg: data.error || "failed" } }));
        } else if (data.skipped) {
          setStatuses((s) => ({ ...s, [p.permalink]: { state: "skipped" } }));
        } else {
          setStatuses((s) => ({
            ...s,
            [p.permalink]: { state: "created", msg: `${data.imageCount} photo${data.imageCount === 1 ? "" : "s"}` },
          }));
        }
      } catch (e) {
        setStatuses((s) => ({ ...s, [p.permalink]: { state: "error", msg: e instanceof Error ? e.message : String(e) } }));
      }
    }
    setImporting(false);
  }

  async function addNotes() {
    if (!user) return;
    setNotesRunning(true);
    setNotesResult(null);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/import-notes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const skipped = data.total - data.created;
      setNotesResult(
        `Added ${data.created} post${data.created === 1 ? "" : "s"}` +
          (skipped ? `, skipped ${skipped} already there.` : ".")
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setNotesRunning(false);
    }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <div className="animate-fade-in-up max-w-3xl">
      <h1 className="text-3xl font-mono font-bold mb-2">Import from the blog</h1>
      <p className="text-sm text-base-content/50 mb-6">
        Load every post from the old Weebly blog, tick the ones you want, pick a
        trip, and import them. Make the trip first (+ New → New Trip). Photos come
        in full-res; already-imported posts are skipped, so it&apos;s safe to
        re-run.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={loadPosts} disabled={loading} className="btn btn-outline btn-sm">
          {loading ? <span className="loading loading-spinner loading-xs" /> : "Load all posts"}
        </button>
        {posts.length > 0 && (
          <>
            <button
              onClick={() => setSelected(new Set(posts.map((p) => p.permalink)))}
              className="btn btn-ghost btn-xs"
            >
              Select all
            </button>
            <button onClick={() => setSelected(new Set())} className="btn btn-ghost btn-xs">
              Select none
            </button>
            <span className="text-xs font-mono text-base-content/40">
              {posts.length} posts · {selected.size} picked
            </span>
          </>
        )}
      </div>

      {posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 sticky top-0 bg-base-100/90 backdrop-blur py-2 z-10">
          <label className="text-xs text-base-content/40 font-mono">Into trip:</label>
          <TripSelect value={tripId} onChange={setTripId} />
          <button
            onClick={importSelected}
            disabled={importing || selected.size === 0 || !tripId}
            className="btn btn-primary btn-sm"
          >
            {importing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              `Import ${selected.size} selected`
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="space-y-1 mb-8">
          {posts.map((p) => {
            const st = statuses[p.permalink]?.state ?? "idle";
            return (
              <li
                key={p.permalink}
                className="flex items-start gap-3 border border-base-content/10 rounded-lg px-3 py-2 bg-base-200/30"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.permalink)}
                  onChange={() => toggle(p.permalink)}
                  disabled={importing || st === "created"}
                  className="checkbox checkbox-sm mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 truncate">{p.title}</div>
                  <div className="text-xs font-mono text-base-content/40 flex flex-wrap items-center gap-x-2">
                    <span>{fmtDate(p.dateISO)}</span>
                    <span>· {p.imageCount} photo{p.imageCount === 1 ? "" : "s"}</span>
                    {p.tags.map((t) => (
                      <span key={t} className="badge badge-xs badge-outline">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs font-mono shrink-0 self-center">
                  {st === "importing" && <span className="loading loading-spinner loading-xs" />}
                  {st === "created" && <span className="text-success">✓ {statuses[p.permalink]?.msg}</span>}
                  {st === "skipped" && <span className="text-base-content/40">skipped</span>}
                  {st === "error" && <span className="text-error break-all">{statuses[p.permalink]?.msg}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border border-base-content/10 rounded-xl p-4 bg-base-200/30 mb-8">
        <div className="font-mono text-sm mb-1">New Zealand trip notes (Oct 19–26)</div>
        <p className="text-xs text-base-content/50 mb-3">
          Adds the eight hand-written entries from the end of the NZ trip, dated
          and map-pinned, text only. Safe to run more than once.
        </p>
        <button onClick={addNotes} disabled={notesRunning} className="btn btn-primary btn-sm">
          {notesRunning ? <span className="loading loading-spinner loading-xs" /> : "Add the 8 notes posts"}
        </button>
        {notesResult && (
          <div className="alert alert-success text-sm mt-3">
            <span>{notesResult}</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-mono text-base-content/40 hover:text-primary">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
