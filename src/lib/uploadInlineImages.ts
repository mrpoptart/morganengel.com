import { uploadImage } from "./upload";

// Maps an exact data: URI to the Storage URL we uploaded it to. The same base64
// image recurs on every autosave (it stays in the editor until reload), so this
// keeps us from re-uploading it each time — one upload per unique image.
const uploadedCache = new Map<string, string>();

// Firestore limits a document to ~1 MiB. Images pasted into the editor as data:
// URIs get embedded inline in the content HTML and can blow past that, failing
// the save with "content is longer than 1048487 bytes". Before saving, lift any
// inline data: image out to Storage and swap in its URL so the stored HTML only
// carries short links. Safe to call on every autosave thanks to the cache.
export async function uploadInlineImages(html: string): Promise<string> {
  if (typeof window === "undefined" || !html.includes("data:image")) {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const inlineImgs = Array.from(
    doc.querySelectorAll('img[src^="data:image"]')
  );
  for (const img of inlineImgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    let url = uploadedCache.get(src);
    if (!url) {
      const blob = await (await fetch(src)).blob();
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      const file = new File([blob], `pasted-${Date.now()}.${ext}`, {
        type: blob.type || "image/png",
      });
      url = await uploadImage(file);
      uploadedCache.set(src, url);
    }
    img.setAttribute("src", url);
  }
  return doc.body.innerHTML;
}
