// Shared slug helpers. A document must never be saved with an empty slug —
// an empty slug makes it unreachable (its /posts/… or /journal/… URL collapses
// to the index) and can collide with other empty-slug docs.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Guarantee a non-empty slug. Prefer an explicitly provided slug, fall back to
 * the title, and finally to a generated token so a title made entirely of
 * non-Latin script or emoji (which slugify strips to "") still yields a
 * reachable URL. Never returns an empty string.
 */
export function ensureSlug(preferred: string | undefined | null, title: string): string {
  return (
    slugify(preferred ?? "") ||
    slugify(title) ||
    `entry-${Math.random().toString(36).slice(2, 8)}`
  );
}
