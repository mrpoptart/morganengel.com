/**
 * Fix a just-typed word like "hello.how" into "hello. How".
 *
 * Phone keyboards don't reliably add the space after punctuation inside the
 * post editor, so the editor does it when the word is finished. Returns the
 * fixed token, or null to leave it alone.
 *
 * Deliberately conservative: only two plain words of 2+ letters around a
 * single punctuation mark, so URLs, emails, paths, decimals ("3.5"), and
 * abbreviations ("e.g.", "U.S.", "Ph.D.") pass through untouched. A dot
 * followed by a common domain or file extension ("site.com", "notes.txt")
 * is also left as typed.
 */

const TOKEN =
  /^(["“'‘(]?[A-Za-z][A-Za-z'’-]*[A-Za-z])([.!?,;:])([A-Za-z][A-Za-z'’-]*[A-Za-z])([.!?,;:"”'’)]*)$/;

const SENTENCE_END = new Set([".", "!", "?"]);

// After a ".", these look like a domain or file name rather than a sentence.
const DOT_SUFFIXES = new Set([
  "com", "net", "org", "edu", "gov", "io", "co", "uk", "us", "ca", "de", "fr",
  "jp", "au", "me", "dev", "app", "ai", "tv", "info", "biz", "xyz", "blog",
  "html", "htm", "js", "ts", "tsx", "jsx", "css", "json", "md", "txt", "pdf",
  "doc", "docx", "xls", "xlsx", "csv", "png", "jpg", "jpeg", "gif", "webp",
  "svg", "heic", "mp3", "mp4", "mov", "zip", "py", "rb", "go", "sh", "yml",
  "yaml", "xml",
]);

export function fixPunctuationSpacing(token: string): string | null {
  const m = TOKEN.exec(token);
  if (!m) return null;
  const [, before, punct, after, trailing] = m;
  if (punct === "." && DOT_SUFFIXES.has(after.toLowerCase())) return null;
  const next = SENTENCE_END.has(punct)
    ? after[0].toUpperCase() + after.slice(1)
    : after;
  return `${before}${punct} ${next}${trailing}`;
}
