"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuote, DEFAULT_QUOTE_AUTHOR } from "@/lib/quotes";
import { SaveError, formatSaveError } from "@/components/SaveError";

export default function NewQuotePage() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState(DEFAULT_QUOTE_AUTHOR);
  const [publishDate, setPublishDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createQuote({
        body: body.trim(),
        author: author.trim() || DEFAULT_QUOTE_AUTHOR,
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save quote:", error);
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <SaveError message={saveError} />
      <h1 className="text-3xl font-mono font-bold mb-6">New quote</h1>

      <textarea
        placeholder="A short quote..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="textarea textarea-ghost text-lg font-serif italic w-full mb-4 px-0 focus:outline-none resize-y"
      />

      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-base-content/40 font-mono">Author:</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="input input-ghost input-sm font-mono text-sm w-full focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <label className="text-xs text-base-content/40 font-mono">Publish date:</label>
        <input
          type="datetime-local"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          className="input input-ghost input-sm font-mono text-sm text-base-content/50 focus:outline-none"
        />
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <button
          onClick={save}
          disabled={saving || !body.trim()}
          className="btn btn-primary btn-sm"
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Publish"
          )}
        </button>
      </div>
    </div>
  );
}
