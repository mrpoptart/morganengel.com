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

export interface ParsedWeeblyPost {
  title: string;
  slug: string;
  permalink: string;
  dateText: string | null;
  dateISO: string | null;
  contentHtml: string;
  images: string[];
}

function slugFromPermalink(permalink: string): string {
  const m = permalink.match(/\/family-blog\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : "";
}

// Weebly rich text carries inline color/size styles that fight the site's dark
// theme, plus zero-width-space junk. Strip inline styles and normalize so the
// imported content adopts the site's own typography.
function cleanContentHtml(html: string): string {
  return html
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/​|&#8203;|&#x200b;/gi, "")
    .replace(/\sclass="paragraph"/gi, "")
    .trim();
}

/**
 * Parse one or more Weebly blog posts from a listing (blog index / month
 * archive) or a single post permalink. Real posts are the elements whose id
 * starts with "blog-post-" (the page <body> also carries a blog-post class).
 */
export function parseWeeblyListing(
  rawHtml: string,
  pageUrl: string
): ParsedWeeblyPost[] {
  const root = parse(rawHtml, { comment: false });
  const posts: ParsedWeeblyPost[] = [];

  const postEls = root
    .querySelectorAll(".blog-post")
    .filter((el) => (el.getAttribute("id") || "").startsWith("blog-post-"));

  for (const el of postEls) {
    const titleEl = el.querySelector("a.blog-title-link");
    const title = (titleEl?.text || "Untitled").trim().replace(/\s+/g, " ");
    const permalink = absolutizeUrl(titleEl?.getAttribute("href") || "", pageUrl);

    const dateText =
      el.querySelector(".blog-date .date-text")?.text.trim() ||
      el.querySelector(".blog-date")?.text.trim() ||
      null;
    let dateISO: string | null = null;
    if (dateText) {
      const d = new Date(dateText); // Weebly uses MM/DD/YYYY
      if (!Number.isNaN(d.getTime())) dateISO = d.toISOString();
    }

    const contentEl = el.querySelector(".blog-content");
    const images: string[] = [];
    if (contentEl) {
      for (const img of contentEl.querySelectorAll("img")) {
        const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
        const abs = absolutizeUrl(src, pageUrl);
        if (abs) {
          img.setAttribute("src", abs);
          images.push(abs);
        }
      }
      for (const a of contentEl.querySelectorAll("a")) {
        const href = a.getAttribute("href");
        if (href) a.setAttribute("href", absolutizeUrl(href, pageUrl));
      }
    }

    posts.push({
      title,
      slug: slugFromPermalink(permalink) || title.toLowerCase().replace(/[^\w]+/g, "-"),
      permalink,
      dateText,
      dateISO,
      contentHtml: contentEl ? cleanContentHtml(contentEl.innerHTML) : "",
      images,
    });
  }

  return posts;
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
