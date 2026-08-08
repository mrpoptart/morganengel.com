#!/usr/bin/env node

/**
 * Build a self-contained import HTML file for a trip.
 *
 * Merges a small, committed narrative spec (JSON — text only, no images) with a
 * reconstruction HTML file (the big one with the photos, kept OUT of git) and
 * writes one self-contained file that is both:
 *   - human-readable: open it in a browser to proof-read the posts with photos, and
 *   - machine-importable: feed it to /admin/import-itinerary to create the drafts.
 *
 * The base64 photos only ever live in the reconstruction file and this generated
 * output — neither of which needs to be committed. Only the spec + this script do.
 *
 * Usage:
 *   node scripts/build-import-html.mjs <spec.json> <reconstruction.html> [out.html]
 *
 * Spec shape:
 *   {
 *     "tripSlug": "ireland-2011",
 *     "posts": [
 *       {
 *         "day": 2,                       // matches "Day N" in the reconstruction
 *         "title": "Dublin Down",
 *         "dateISO": "2011-10-12T12:00:00Z",
 *         "tags": ["travel", "ireland"],
 *         "location": { "lat": 53.3, "lng": -6.2, "label": "Dublin, Ireland" } | null,
 *         "body": "<p>...{{img}}...</p>",  // {{img}} marks where each photo goes
 *         "imageOrder": [1, 3, 2]          // optional: 1-based figure order per {{img}}
 *       }
 *     ]
 *   }
 *
 * The reconstruction must contain, per day, an element `.day` with a `.dnum`
 * giving "Day N" and one `<figure><img src="data:image/...">` per photo.
 */

import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";
import { parse } from "node-html-parser";

const [specPath, reconPath, outPathArg] = process.argv.slice(2);
if (!specPath || !reconPath) {
  console.error("Usage: node scripts/build-import-html.mjs <spec.json> <reconstruction.html> [out.html]");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const outPath = outPathArg || `${spec.tripSlug || "trip"}-import.html`;

// --- Pull each "Day N" section's photos out of the reconstruction ---
const recon = parse(readFileSync(reconPath, "utf8"), { comment: false });
const figuresByDay = new Map();
for (const dayEl of recon.querySelectorAll(".day")) {
  const n = Number((dayEl.querySelector(".dnum")?.text.match(/(\d+)/) || [])[1]);
  if (!n) continue;
  const figs = dayEl
    .querySelectorAll("figure")
    .map((f) => f.querySelector("img")?.getAttribute("src") || "")
    .filter((src) => src.startsWith("data:image/"));
  figuresByDay.set(n, figs);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Interleave photos into each body at the {{img}} markers ---
function buildContent(post) {
  const figs = figuresByDay.get(post.day) || [];
  const order = post.imageOrder || figs.map((_, i) => i + 1);
  const imgs = order
    .map((i) => figs[i - 1])
    .filter(Boolean)
    .map((src) => `<img src="${src}" class="rounded-lg max-w-full">`);
  const parts = post.body.split("{{img}}");
  let html = parts[0];
  for (let i = 1; i < parts.length; i++) html += (imgs[i - 1] ?? "") + parts[i];
  if (imgs.length > parts.length - 1) html += imgs.slice(parts.length - 1).join("");
  return { html, slots: parts.length - 1, photos: figs.length };
}

// --- Emit the self-contained file ---
const articles = [];
let problems = 0;
for (const post of spec.posts) {
  const { html, slots, photos } = buildContent(post);
  const ok = slots === photos;
  if (!ok) problems++;
  const loc = post.location || {};
  const attrs = [
    `class="post"`,
    `data-title="${esc(post.title)}"`,
    `data-date="${esc(post.dateISO || "")}"`,
    `data-tags="${esc((post.tags || []).join(","))}"`,
    post.location ? `data-lat="${loc.lat}"` : "",
    post.location ? `data-lng="${loc.lng}"` : "",
    post.location && loc.label ? `data-label="${esc(loc.label)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  articles.push(
    `<article ${attrs}>\n` +
      `<h1 class="post-title">${esc(post.title)}</h1>\n` +
      `<p class="post-meta">${esc(post.dateISO?.slice(0, 10) || "")}` +
      `${post.location && loc.label ? ` · ${esc(loc.label)}` : ""}` +
      ` · ${photos} photos</p>\n` +
      `<div class="post-body">\n${html}\n</div>\n</article>`
  );
  console.log(`  Day ${post.day} “${post.title}” — ${slots} slots / ${photos} photos ${ok ? "OK" : "⚠ MISMATCH"}`);
}

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.tripSlug)} — import</title>
<style>
  body { font: 16px/1.6 -apple-system, system-ui, sans-serif; max-width: 46rem; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; background: #fafafa; }
  article { border-top: 3px solid #ccc; padding-top: 1.5rem; margin: 3rem 0; }
  .post-title { font-size: 1.8rem; margin: 0 0 .25rem; }
  .post-meta { color: #888; font-size: .85rem; margin: 0 0 1rem; font-family: ui-monospace, monospace; }
  .post-body img { display: block; max-width: 100%; height: auto; border-radius: .5rem; margin: 1rem 0; }
  p { margin: 1rem 0; }
</style>
</head>
<body data-trip="${esc(spec.tripSlug)}">
${articles.join("\n\n")}
</body>
</html>
`;

writeFileSync(outPath, doc);
const sizeMB = (Buffer.byteLength(doc) / 1e6).toFixed(1);
console.log(`\nWrote ${outPath} (${sizeMB} MB, ${spec.posts.length} posts)${problems ? ` — ${problems} MISMATCH(es) above` : ""}`);
