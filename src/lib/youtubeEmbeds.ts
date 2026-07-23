// Inline YouTube iframes get hit with YouTube's "Sign in to confirm you're not
// a bot" gate, which we can't control from our side. So at render time we swap
// each stored embed for a tappable thumbnail that links out to the video on
// youtube.com — a plain navigation YouTube never challenges, and on mobile it
// opens the YouTube app. Existing posts are fixed without re-editing.

const YT_EMBED_BLOCK =
  /<div[^>]*data-youtube-video[^>]*>[\s\S]*?<\/div>/gi;
const YT_ID = /\/embed\/([A-Za-z0-9_-]{6,})/;

function card(id: string): string {
  const href = `https://www.youtube.com/watch?v=${id}`;
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return (
    `<a class="yt-embed-card" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Watch on YouTube">` +
    `<img src="${thumb}" alt="" loading="lazy" />` +
    `<span class="yt-embed-play" aria-hidden="true">` +
    `<svg viewBox="0 0 68 48" width="68" height="48"><path class="yt-embed-play-bg" d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.4.5 34 .5 34 .5S12.6.5 7.4 1.7C4.5 2.5 2.3 4.8 1.5 7.7.3 12.9.3 24 .3 24s0 11.1 1.2 16.3c.8 2.9 3 5.2 5.9 6C12.6 47.5 34 47.5 34 47.5s21.4 0 26.6-1.2c2.9-.8 5.1-3.1 5.9-6C67.7 35.1 67.7 24 67.7 24s0-11.1-1.2-16.3z"/><path d="M27 34.5l17.8-10.5L27 13.5v21z" fill="#fff"/></svg>` +
    `</span>` +
    `</a>`
  );
}

export function transformYoutubeEmbeds(html: string): string {
  return html.replace(YT_EMBED_BLOCK, (block) => {
    const m = block.match(YT_ID);
    return m ? card(m[1]) : block;
  });
}
