// YouTube's embedded player challenges playback ("Sign in to confirm you're
// not a bot" / Error 153) when the iframe doesn't send a Referer it can use to
// identify the embedding site. The fix YouTube itself documents is to set
// referrerpolicy="strict-origin-when-cross-origin" on the iframe. TipTap's
// stored embeds don't include it, so at render time we rebuild each embed with
// the referrer policy (and a clean allow list) — repairing existing posts
// without re-editing.

const YT_EMBED_BLOCK = /<div[^>]*data-youtube-video[^>]*>[\s\S]*?<\/div>/gi;
const YT_SRC = /src="([^"]+)"/i;

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function normalizeSrc(src: string): string {
  return src.replace("youtube-nocookie.com", "youtube.com");
}

export function transformYoutubeEmbeds(html: string): string {
  return html.replace(YT_EMBED_BLOCK, (block) => {
    const m = block.match(YT_SRC);
    if (!m) return block;
    const src = normalizeSrc(m[1]);
    return (
      `<div data-youtube-video>` +
      `<iframe src="${src}" title="YouTube video player" frameborder="0" ` +
      `allow="${IFRAME_ALLOW}" ` +
      `referrerpolicy="strict-origin-when-cross-origin" ` +
      `allowfullscreen></iframe>` +
      `</div>`
    );
  });
}
