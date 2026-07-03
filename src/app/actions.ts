"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalidate the cached home page feed.
 *
 * The home page (`src/app/page.tsx`) is served via ISR (`revalidate = 60`),
 * so it caches the rendered post/quote feed. Content is written to Firestore
 * directly from the browser (client SDK), which never notifies Next.js that
 * the feed changed. Call this after any create/update/delete so a freshly
 * published post or quote shows up immediately instead of waiting for the
 * stale-while-revalidate window to lapse.
 */
export async function revalidateHome(): Promise<void> {
  revalidatePath("/");
}
