"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { IRELAND_ITINERARY } from "@/lib/ireland-itinerary";

type RowState = "idle" | "importing" | "created" | "skipped" | "error";

interface Figure {
  src: string;
  caption: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Pull each "Day N" section's photos (data URIs + captions) out of the source
// HTML the user assembled, keyed by day number.
function parseDays(html: string): Map<number, Figure[]> {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const byDay = new Map<number, Figure[]>();
  for (const day of Array.from(dom.querySelectorAll(".day"))) {
    const dnum = day.querySelector(".dnum")?.textContent?.trim() || "";
    const n = Number((dnum.match(/(\d+)/) || [])[1]);
    if (!n) continue;
    const figs: Figure[] = [];
    for (const fig of Array.from(day.querySelectorAll("figure"))) {
      const src = fig.querySelector("img")?.getAttribute("src") || "";
      if (!src.startsWith("data:image/")) continue;
      const caption = (fig.querySelector("figcaption")?.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      figs.push({ src, caption });
    }
    byDay.set(n, figs);
  }
  return byDay;
}

export default function ImportItineraryPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<Map<number, Figure[]> | null>(null);
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
      const text = await file.text();
      const parsed = parseDays(text);
      if (parsed.size === 0) throw new Error("No day sections found in that file.");
      setDays(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDays(null);
    }
  }

  function buildContent(day: number): string {
    const post = IRELAND_ITINERARY.find((p) => p.day === day)!;
    const figs = days?.get(day) ?? [];
    const paras = post.lead.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const photos = figs
      .map(
        (f) =>
          `<img src="${f.src}" class="rounded-lg max-w-full">` +
          (f.caption ? `<p><em>${escapeHtml(f.caption)}</em></p>` : "")
      )
      .join("");
    return paras + photos;
  }

  async function importAll() {
    if (!user || !days) return;
    setImporting(true);
    setError(null);
    for (const post of IRELAND_ITINERARY) {
      setStatuses((s) => ({ ...s, [post.day]: { state: "importing" } }));
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/import-itinerary-post", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: post.title,
            content: buildContent(post.day),
            tags: post.tags,
            location: post.location,
            dateISO: post.dateISO,
            tripSlug: "ireland-2011",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [post.day]: { state: "error", msg: data.error || "failed" } }));
        } else if (data.skipped) {
          setStatuses((s) => ({ ...s, [post.day]: { state: "skipped" } }));
        } else {
          setStatuses((s) => ({
            ...s,
            [post.day]: { state: "created", msg: `${data.imageCount} photos` },
          }));
        }
      } catch (e) {
        setStatuses((s) => ({
          ...s,
          [post.day]: { state: "error", msg: e instanceof Error ? e.message : String(e) },
        }));
      }
    }
    setImporting(false);
  }

  return (
    <div className="animate-fade-in-up max-w-3xl">
      <h1 className="text-3xl font-mono font-bold mb-2">Import Ireland reconstruction</h1>
      <p className="text-sm text-base-content/50 mb-6">
        Pick the <code>ireland2011</code> HTML file you assembled. Each day
        becomes a <b>draft</b> journal entry in the Ireland 2011 trip, dated and
        map-pinned, with that day&apos;s photos re-hosted. Review the voice and
        publish when you&apos;re happy. Already-imported days are skipped, so
        it&apos;s safe to re-run.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="file"
          accept=".html,text/html"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="file-input file-input-bordered file-input-sm"
        />
        {days && (
          <button onClick={importAll} disabled={importing} className="btn btn-primary btn-sm">
            {importing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              `Import ${IRELAND_ITINERARY.length} days as drafts`
            )}
          </button>
        )}
      </div>
      {fileName && (
        <p className="text-xs font-mono text-base-content/40 mb-4">
          Loaded {fileName}
          {days ? ` · ${days.size} day sections found` : ""}
        </p>
      )}

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      {days && (
        <ul className="space-y-1 mb-8">
          {IRELAND_ITINERARY.map((post) => {
            const st = statuses[post.day]?.state ?? "idle";
            const photoCount = days.get(post.day)?.length ?? 0;
            return (
              <li
                key={post.day}
                className="flex items-start gap-3 border border-base-content/10 rounded-lg px-3 py-2 bg-base-200/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 truncate">{post.title}</div>
                  <div className="text-xs font-mono text-base-content/40 flex flex-wrap items-center gap-x-2">
                    <span>{new Date(post.dateISO).toLocaleDateString()}</span>
                    <span>· {photoCount} photos</span>
                    {post.location && <span>· {post.location.label}</span>}
                  </div>
                </div>
                <div className="text-xs font-mono shrink-0 self-center">
                  {st === "importing" && <span className="loading loading-spinner loading-xs" />}
                  {st === "created" && <span className="text-success">✓ {statuses[post.day]?.msg}</span>}
                  {st === "skipped" && <span className="text-base-content/40">skipped</span>}
                  {st === "error" && <span className="text-error break-all">{statuses[post.day]?.msg}</span>}
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
