import { uploadImage } from "./upload";

// Firestore limits a document to ~1 MiB. Images pasted into the editor as data:
// URIs get embedded inline in the content HTML and can blow past that, failing
// the save with "content is longer than 1048487 bytes". Before saving, lift any
// inline data: image out to Storage and swap in its URL so the stored HTML only
// carries short links.
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
    const blob = await (await fetch(src)).blob();
    const ext = (blob.type.split("/")[1] || "png").split("+")[0];
    const file = new File([blob], `pasted-${Date.now()}.${ext}`, {
      type: blob.type || "image/png",
    });
    const url = await uploadImage(file);
    img.setAttribute("src", url);
  }
  return doc.body.innerHTML;
}
