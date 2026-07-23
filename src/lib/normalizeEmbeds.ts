// YouTube's "Sign in to confirm you're not a bot" gate hits the
// privacy-enhanced youtube-nocookie.com player hardest: that player sends no
// viewer cookies, so YouTube can't recognize a signed-in human and challenges
// the playback. Rewriting embeds to the standard youtube.com domain lets the
// viewer's own YouTube session through, which clears the gate in the common
// case. Applied at render time so posts saved with old nocookie URLs are fixed
// without re-editing.
export function normalizeEmbeds(html: string): string {
  return html.replaceAll("youtube-nocookie.com", "youtube.com");
}
