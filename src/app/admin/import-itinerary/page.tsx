"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

type RowState = "idle" | "importing" | "created" | "skipped" | "error";

interface ParsedPost {
  title: string;
  dateISO: string;
  tags: string[];
  location: { lat: number; lng: number; label?: string } | null;
  tripSlug: string;
  content: string;
  photoCount: number;
}

// Parse a self-contained import file: any HTML with <article class="post">
// elements carrying data-title / data-date / data-tags / data-lat / data-lng /
// data-label, a <div class="post-body"> holding the content, and an optional
// data-trip on the article or <body>. Built by scripts/build-import-html.mjs.
function parsePosts(html: string): ParsedPost[] {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const bodyTrip = dom.body?.getAttribute("data-trip") || "";
  const posts: ParsedPost[] = [];
  for (const art of Array.from(dom.querySelectorAll("article.post"))) {
    const el = art as HTMLElement;
    const bodyEl = el.querySelector(".post-body");
    const content = (bodyEl?.innerHTML || "").trim();
    if (!content) continue;
    const lat = el.getAttribute("data-lat");
    const lng = el.getAttribute("data-lng");
    const label = el.getAttribute("data-label") || undefined;
    const location =
      lat && lng ? { lat: Number(lat), lng: Number(lng), label } : null;
    posts.push({
      title: (el.getAttribute("data-title") || "").trim(),
      dateISO: el.getAttribute("data-date") || "",
      tags: (el.getAttribute("data-tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      location,
      tripSlug: el.getAttribute("data-trip") || bodyTrip,
      content,
      photoCount: (content.match(/<img\b/g) || []).length,
    });
  }
  return posts;
}

export default function ImportItineraryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ParsedPost[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [statuses, setStatuses] = useState<Record<number, { state: RowState; msg?: string }>>({});
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setStatuses({});
    setFileName(file.name);
    try {
      const parsed = parsePosts(await file.text());
      if (parsed.length === 0) {
        throw new Error("No <article class=\"post\"> entries found in that file.");
      }
      setPosts(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPosts(null);
    }
  }

  async function importAll() {
    if (!user || !posts) return;
    setImporting(true);
    setError(null);
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      setStatuses((s) => ({ ...s, [i]: { state: "importing" } }));
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/import-itinerary-post", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            tags: post.tags,
            location: post.location,
            dateISO: post.dateISO,
            tripSlug: post.tripSlug,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [i]: { state: "error", msg: data.error || "failed" } }));
        } else if (data.skipped) {
          setStatuses((s) => ({ ...s, [i]: { state: "skipped" } }));
        } else {
          setStatuses((s) => ({ ...s, [i]: { state: "created", msg: `${data.imageCount} photos` } }));
        }
      } catch (e) {
        setStatuses((s) => ({
          ...s,
          [i]: { state: "error", msg: e instanceof Error ? e.message : String(e) },
        }));
      }
    }
    setImporting(false);
  }

  const tripSlug = posts?.[0]?.tripSlug;

  return (
    <div className="animate-fade-in-up max-w-3xl">
      <h1 className="text-3xl font-mono font-bold mb-2">Import posts from file</h1>
      <p className="text-sm text-base-content/50 mb-6">
        Pick a self-contained import HTML file (built with{" "}
        <code>scripts/build-import-html.mjs</code>). Each{" "}
        <code>&lt;article class=&quot;post&quot;&gt;</code> becomes a <b>draft</b>{" "}
        journal entry &mdash; dated, tagged, and map-pinned, with its inline
        photos re-hosted to storage. Nothing is published; review and touch up in
        the editor, then publish. Already-imported posts are skipped by slug, so
        it&apos;s safe to re-run, and no image data ever needs to live in the repo.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="file"
          accept=".html,text/html"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="file-input file-input-bordered file-input-sm"
        />
        {posts && (
          <button onClick={importAll} disabled={importing} className="btn btn-primary btn-sm">
            {importing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              `Import ${posts.length} posts as drafts`
            )}
          </button>
        )}
      </div>
      {fileName && (
        <p className="text-xs font-mono text-base-content/40 mb-4">
          Loaded {fileName}
          {posts ? ` · ${posts.length} posts` : ""}
          {tripSlug ? ` · trip: ${tripSlug}` : ""}
        </p>
      )}

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      {posts && (
        <ul className="space-y-1 mb-8">
          {posts.map((post, i) => {
            const st = statuses[i]?.state ?? "idle";
            return (
              <li
                key={i}
                className="flex items-start gap-3 border border-base-content/10 rounded-lg px-3 py-2 bg-base-200/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 truncate">{post.title}</div>
                  <div className="text-xs font-mono text-base-content/40 flex flex-wrap items-center gap-x-2">
                    <span>{post.dateISO ? new Date(post.dateISO).toLocaleDateString() : "no date"}</span>
                    <span>· {post.photoCount} photos</span>
                    {post.location?.label && <span>· {post.location.label}</span>}
                    {!post.tripSlug && <span className="text-warning">· no trip ⚠</span>}
                  </div>
                </div>
                <div className="text-xs font-mono shrink-0 self-center">
                  {st === "importing" && <span className="loading loading-spinner loading-xs" />}
                  {st === "created" && <span className="text-success">✓ {statuses[i]?.msg}</span>}
                  {st === "skipped" && <span className="text-base-content/40">skipped</span>}
                  {st === "error" && <span className="text-error break-all">{statuses[i]?.msg}</span>}
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
