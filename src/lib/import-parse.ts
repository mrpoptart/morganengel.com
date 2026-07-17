import "server-only";
import { parse, type HTMLElement } from "node-html-parser";

export interface ParsedPost {
  title: string;
  dateText: string | null;
  dateISO: string | null;
  contentHtml: string;
  images: string[];
}

// Content containers to try, most specific first. Refined against the real
// blog markup once we can see it.
const CONTENT_SELECTORS = [
  ".post-content",
  ".entry-content",
  ".post-body",
  ".entry-body",
  "article .content",
  "article",
  ".post",
  ".entry",
  ".blogbody",
  "#content",
  "#main",
  "main",
];

const TITLE_SELECTORS = [
  ".post-title",
  ".entry-title",
  ".post h1",
  ".post h2",
  "article h1",
  "h1.title",
  "h1",
  "h2",
];

function stripWaybackChrome(html: string): string {
  return html
    .replace(/<!--\s*BEGIN WAYBACK TOOLBAR INSERT\s*-->[\s\S]*?<!--\s*END WAYBACK TOOLBAR INSERT\s*-->/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
}

/** Turn a wayback-rewritten or relative URL into an absolute, fetchable one. */
export function absolutizeUrl(src: string, pageUrl: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  try {
    return new URL(src, pageUrl).toString();
  } catch {
    return src;
  }
}

function pickFirst(root: HTMLElement, selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el && el.text.trim().length > 0) return el;
  }
  return null;
}

function extractTitle(root: HTMLElement): string {
  const el = pickFirst(root, TITLE_SELECTORS);
  if (el) return el.text.trim().replace(/\s+/g, " ");
  const t = root.querySelector("title");
  if (t) {
    // Drop a trailing "  |  Site Name" / " - Site Name".
    return t.text.split(/\s[|»–-]\s/)[0].trim();
  }
  return "Untitled";
}

function extractDate(root: HTMLElement, html: string): { text: string | null; iso: string | null } {
  const time = root.querySelector("time");
  const candidate =
    time?.getAttribute("datetime") ||
    time?.text ||
    root.querySelector(".post-date, .entry-date, .date, .published")?.text ||
    null;
  const text = candidate?.trim() || matchDateString(html);
  if (!text) return { text: null, iso: null };
  const d = new Date(text);
  return { text, iso: Number.isNaN(d.getTime()) ? null : d.toISOString() };
}

function matchDateString(html: string): string | null {
  const text = html.replace(/<[^>]+>/g, " ");
  const m =
    text.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/) ||
    text.match(/\b\d{4}-\d{2}-\d{2}\b/) ||
    text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
  return m ? m[0] : null;
}

export function parseArchivedPost(rawHtml: string, pageUrl: string): ParsedPost {
  const cleaned = stripWaybackChrome(rawHtml);
  const root = parse(cleaned, { comment: false });

  const title = extractTitle(root);
  const { text: dateText, iso: dateISO } = extractDate(root, cleaned);

  const container = pickFirst(root, CONTENT_SELECTORS) ?? root.querySelector("body") ?? root;

  // Absolutize images and collect them.
  const images: string[] = [];
  for (const img of container.querySelectorAll("img")) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    const abs = absolutizeUrl(src, pageUrl);
    if (abs) {
      img.setAttribute("src", abs);
      images.push(abs);
    }
  }

  // Absolutize links too.
  for (const a of container.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    if (href) a.setAttribute("href", absolutizeUrl(href, pageUrl));
  }

  return {
    title,
    dateText,
    dateISO,
    contentHtml: container.innerHTML.trim(),
    images,
  };
}
