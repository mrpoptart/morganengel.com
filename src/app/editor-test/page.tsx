import type { Metadata } from "next";
import { EditorTest } from "./EditorTest";

// Temporary page for diagnosing Gboard auto-spacing in the post editor.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <EditorTest />;
}
