import { describe, it, expect } from "vitest";
import { flattenWeeblyGalleries } from "./import-parse";

const GALLERY = `<div>Intro text.</div><div id='123-gallery' class='imageGallery' style='line-height:0'><div style='float:left;width:33%'><div class='galleryImageBorder'><div class='galleryImageHolder' style='padding:0 0 75%;overflow:hidden'><div class='galleryInnerImageHolder'><a href="https://ex.com/a_orig.jpg" rel="lightbox[g123]" onclick="if (!window.lightboxLoaded) return false"><img src="https://cdn/1.jpg" class="rounded-lg max-w-full"></a></div></div></div></div><div style='float:left;width:33%'><div class='galleryInnerImageHolder'><a href="https://ex.com/b_orig.jpg" rel="lightbox[g123]" onclick="if (!window.lightboxLoaded) return false"><img src="https://cdn/2.jpg" class="rounded-lg max-w-full"></a></div></div><span style='clear:both'></span></div>`;

describe("flattenWeeblyGalleries", () => {
  it("removes the gallery scaffolding classes and float styles", () => {
    const out = flattenWeeblyGalleries(GALLERY);
    expect(out).not.toContain("imageGallery");
    expect(out).not.toContain("galleryImageHolder");
    expect(out).not.toContain("float:left");
  });

  it("reduces gallery photos to bare images with no anchor wrapper", () => {
    const out = flattenWeeblyGalleries(GALLERY);
    expect(out).toContain('src="https://cdn/1.jpg"');
    expect(out).toContain('src="https://cdn/2.jpg"');
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href=");
    expect(out).not.toContain("lightboxLoaded");
  });

  it("preserves surrounding prose", () => {
    expect(flattenWeeblyGalleries(GALLERY)).toContain("Intro text.");
  });

  it("unwraps a bare full-res image link left by an earlier pass", () => {
    const priorPass =
      '<p>Hi</p><a href="https://x.weebly.com/uploads/1/2/a_orig.jpg"><img src="https://cdn/1.jpg" class="rounded-lg max-w-full"></a>';
    const out = flattenWeeblyGalleries(priorPass);
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href=");
    expect(out).toContain('src="https://cdn/1.jpg"');
    expect(out).toContain("<p>Hi</p>");
  });

  it("is a no-op for content without galleries, and idempotent", () => {
    const plain = "<p>Just words and <img src=\"x.jpg\"></p>";
    expect(flattenWeeblyGalleries(plain)).toBe(plain);
    const once = flattenWeeblyGalleries(GALLERY);
    expect(flattenWeeblyGalleries(once)).toBe(once);
  });
});
