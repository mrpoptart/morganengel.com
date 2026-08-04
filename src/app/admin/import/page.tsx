"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES: { slug: string; label: string; trip: boolean; note?: string }[] = [
  { slug: "ireland", label: "Ireland", trip: true },
  { slug: "costa-rica", label: "Costa Rica", trip: true },
  { slug: "michigan", label: "Michigan", trip: true },
  { slug: "arizona", label: "Arizona", trip: true },
  { slug: "chicago", label: "Chicago", trip: true },
  { slug: "new-mexico", label: "New Mexico", trip: true },
  { slug: "orange-county", label: "Orange County", trip: true },
  { slug: "torch-lake", label: "Torch Lake", trip: false, note: "in Michigan" },
  { slug: "camping", label: "Camping", trip: false, note: "tag" },
  { slug: "cars", label: "Cars", trip: false, note: "tag" },
  { slug: "kids", label: "Kids", trip: false, note: "tag" },
];

interface NzPost {
  title: string;
  slug: string;
  permalink: string;
  dateISO: string | null;
  dateText: string | null;
  imageCount: number;
}

type PostState =
  | { state: "idle" }
  | { state: "importing" }
  | { state: "created"; message: string }
  | { state: "skipped"; message: string }
  | { state: "error"; message: string };

export default function ImportPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NzPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, PostState>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesRunning, setNotesRunning] = useState(false);
  const [notesResult, setNotesResult] = useState<string | null>(null);
  const [catSelected, setCatSelected] = useState<Set<string>>(
    new Set(CATEGORIES.filter((c) => c.trip).map((c) => c.slug))
  );
  const [catStatus, setCatStatus] = useState<Record<string, string>>({});
  const [catRunning, setCatRunning] = useState(false);

  function toggleCat(slug: string) {
    setCatSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function importCategories() {
    if (!user) return;
    setCatRunning(true);
    setError(null);
    const chosen = CATEGORIES.filter((c) => catSelected.has(c.slug));
    for (const cat of chosen) {
      try {
        setCatStatus((s) => ({ ...s, [cat.slug]: "loading posts…" }));
        const listRes = await fetch(`/api/import-preview?catlist=${cat.slug}`);
        const list = await listRes.json();
        if (!listRes.ok) throw new Error(list.error || "list failed");
        if (!list.count) {
          setCatStatus((s) => ({ ...s, [cat.slug]: "no posts found" }));
          continue;
        }
        const year = list.earliest ? new Date(list.earliest).getFullYear() : "";
        const tripTitle = year ? `${cat.label} ${year}` : cat.label;
        const tripSlug = year ? `${cat.slug}-${year}` : cat.slug;

        let token = await user.getIdToken();
        const tripRes = await fetch("/api/import-trip", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ slug: tripSlug, title: tripTitle, publishedAt: list.latest }),
        });
        const trip = await tripRes.json();
        if (!tripRes.ok) throw new Error(trip.error || "trip failed");

        let created = 0;
        let skipped = 0;
        let errors = 0;
        for (let i = 0; i < list.posts.length; i++) {
          const post = list.posts[i];
          setCatStatus((s) => ({
            ...s,
            [cat.slug]: `${tripTitle}: importing ${i + 1}/${list.count}…`,
          }));
          try {
            token = await user.getIdToken();
            const r = await fetch("/api/import-post", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                url: post.permalink,
                tripId: trip.tripId,
                tags: ["travel", cat.slug],
              }),
            });
            const data = await r.json();
            if (!r.ok) errors++;
            else if (data.skipped) skipped++;
            else created++;
          } catch {
            errors++;
          }
        }
        setCatStatus((s) => ({
          ...s,
          [cat.slug]: `${tripTitle}: ${created} added${skipped ? `, ${skipped} skipped` : ""}${
            errors ? `, ${errors} failed` : ""
          }`,
        }));
      } catch (e) {
        setCatStatus((s) => ({
          ...s,
          [cat.slug]: `error: ${e instanceof Error ? e.message : String(e)}`,
        }));
      }
    }
    setCatRunning(false);
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

  async function loadList() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/import-preview?nzlist=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPosts(data.posts as NzPost[]);
      setSelected(new Set((data.posts as NzPost[]).map((p) => p.permalink)));
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
    if (!user) return;
    setImporting(true);
    setError(null);
    const toImport = posts.filter((p) => selected.has(p.permalink));
    for (const p of toImport) {
      setStatuses((s) => ({ ...s, [p.permalink]: { state: "importing" } }));
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/import-post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: p.permalink }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((s) => ({
            ...s,
            [p.permalink]: { state: "error", message: data.error || "failed" },
          }));
        } else if (data.skipped) {
          setStatuses((s) => ({
            ...s,
            [p.permalink]: { state: "skipped", message: data.reason || "exists" },
          }));
        } else {
          const loc = data.location ? ` · ${data.location}` : "";
          setStatuses((s) => ({
            ...s,
            [p.permalink]: {
              state: "created",
              message: `${data.imageCount} photo${data.imageCount === 1 ? "" : "s"}${loc}`,
            },
          }));
        }
      } catch (e) {
        setStatuses((s) => ({
          ...s,
          [p.permalink]: {
            state: "error",
            message: e instanceof Error ? e.message : String(e),
          },
        }));
      }
    }
    setImporting(false);
  }

  const fmtDate = (iso: string | null, text: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : text ?? "—";

  return (
    <div className="animate-fade-in-up max-w-3xl">
      <h1 className="text-3xl font-mono font-bold mb-2">Import New Zealand posts</h1>
      <p className="text-sm text-base-content/50 mb-6">
        Pulls the family blog&apos;s New Zealand posts (Sept–Oct 2017) into your{" "}
        <strong>New Zealand 2017</strong> trip — text, photos, dates, and a map
        pin where the place is obvious. Already-imported posts are skipped, so
        it&apos;s safe to run more than once. Uncheck any you added by hand.
      </p>

      <div className="border border-base-content/10 rounded-xl p-4 bg-base-200/30 mb-8">
        <div className="font-mono text-sm mb-1">Trips from Weebly categories</div>
        <p className="text-xs text-base-content/50 mb-3">
          Each ticked category becomes a trip (named with its year), and its
          posts are imported into it with full-res photos. Goes one post at a
          time to stay under Weebly&apos;s rate limits, so big trips take a few
          minutes. Safe to re-run — already-imported posts are skipped.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          {CATEGORIES.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={catSelected.has(c.slug)}
                onChange={() => toggleCat(c.slug)}
                disabled={catRunning}
                className="checkbox checkbox-xs"
              />
              <span className="truncate">
                {c.label}
                {c.note && (
                  <span className="text-base-content/40 text-xs"> ({c.note})</span>
                )}
              </span>
            </label>
          ))}
        </div>
        <button
          onClick={importCategories}
          disabled={catRunning || catSelected.size === 0}
          className="btn btn-primary btn-sm"
        >
          {catRunning ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            `Import ${catSelected.size} as trips`
          )}
        </button>
        {Object.keys(catStatus).length > 0 && (
          <ul className="mt-3 space-y-1 text-xs font-mono">
            {CATEGORIES.filter((c) => catStatus[c.slug]).map((c) => (
              <li key={c.slug} className="text-base-content/70 break-all">
                {catStatus[c.slug]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-base-content/10 rounded-xl p-4 bg-base-200/30 mb-8">
        <div className="font-mono text-sm mb-1">Trip notes (Oct 19–26)</div>
        <p className="text-xs text-base-content/50 mb-3">
          Adds the eight hand-written entries from the end of the trip, dated and
          map-pinned, text only. Safe to run more than once. Add photos after in
          the editor.
        </p>
        <button onClick={addNotes} disabled={notesRunning} className="btn btn-primary btn-sm">
          {notesRunning ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Add the 8 notes posts"
          )}
        </button>
        {notesResult && (
          <div className="alert alert-success text-sm mt-3">
            <span>{notesResult}</span>
          </div>
        )}
      </div>

      <div className="font-mono text-sm mb-3">Weebly blog posts</div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={loadList}
          disabled={loading}
          className="btn btn-outline btn-sm"
        >
          {loading ? <span className="loading loading-spinner loading-xs" /> : "Load posts"}
        </button>
        <button
          onClick={importSelected}
          disabled={importing || selected.size === 0 || posts.length === 0}
          className="btn btn-primary btn-sm"
        >
          {importing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            `Import ${selected.size} selected`
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="space-y-2">
          {posts.map((p) => {
            const st = statuses[p.permalink]?.state ?? "idle";
            return (
              <li
                key={p.permalink}
                className="flex items-start gap-3 border border-base-content/10 rounded-lg p-3 bg-base-200/30"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.permalink)}
                  onChange={() => toggle(p.permalink)}
                  disabled={importing || st === "created"}
                  className="checkbox checkbox-sm mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-base-content/90 truncate">
                    {p.title}
                  </div>
                  <div className="text-xs font-mono text-base-content/40">
                    {fmtDate(p.dateISO, p.dateText)} · {p.imageCount} photo
                    {p.imageCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-xs font-mono shrink-0 self-center">
                  {st === "importing" && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {st === "created" && (
                    <span className="text-success">
                      ✓ {statuses[p.permalink] && "message" in statuses[p.permalink]
                        ? (statuses[p.permalink] as { message: string }).message
                        : ""}
                    </span>
                  )}
                  {st === "skipped" && <span className="text-base-content/40">skipped</span>}
                  {st === "error" && (
                    <span className="text-error break-all">
                      {(statuses[p.permalink] as { message: string }).message}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-mono text-base-content/40 hover:text-primary">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
