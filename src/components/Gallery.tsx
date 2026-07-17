"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

function ChevronLeft() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-10">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className="aspect-square overflow-hidden rounded-lg border border-base-content/10 group focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in-up"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 text-white/70 hover:text-white p-2 transition-colors"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-white/60 text-sm font-mono">
              {open + 1} / {images.length}
            </div>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="group absolute left-0 top-0 h-full w-1/3 flex items-center justify-start pl-2 sm:pl-4 z-10"
            >
              <span className="text-white/40 group-hover:text-white/90 group-active:text-white transition-colors">
                <ChevronLeft />
              </span>
            </button>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="group absolute right-0 top-0 h-full w-1/3 flex items-center justify-end pr-2 sm:pr-4 z-10"
            >
              <span className="text-white/40 group-hover:text-white/90 group-active:text-white transition-colors">
                <ChevronRight />
              </span>
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[open]}
            alt={`Photo ${open + 1}`}
            className="max-h-[90vh] max-w-[92vw] object-contain select-none pointer-events-none"
          />
          </div>,
          document.body
        )}
    </>
  );
}
