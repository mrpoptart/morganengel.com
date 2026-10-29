"use client";

import { useCallback, useState } from "react";
import { Editor } from "@/components/Editor";

export function EditorTest() {
  const [, setHtml] = useState("");
  const onUpdate = useCallback((_json: unknown, html: string) => setHtml(html), []);
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <p className="text-sm">The real post editor, with the keyboard fix. Type &quot;hello.how&quot;.</p>
      <Editor onUpdate={onUpdate} />
    </div>
  );
}
