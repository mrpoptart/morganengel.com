"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getQuoteById,
  updateQuote,
  deleteQuote,
  DEFAULT_QUOTE_AUTHOR,
} from "@/lib/quotes";
import { SaveError, formatSaveError } from "@/components/SaveError";
import { useToast } from "@/components/ToastProvider";
import type { Quote } from "@/types/quote";

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = await getQuoteById(id);
      if (!q) {
        router.push("/admin");
        return;
      }
      setQuote(q);
      setBody(q.body);
      setAuthor(q.author);
      if (q.publishedAt) {
        setPublishDate(q.publishedAt.toDate().toISOString().slice(0, 16));
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function save() {
    if (!quote || !body.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateQuote(quote.id, {
        body: body.trim(),
        author: author.trim() || DEFAULT_QUOTE_AUTHOR,
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      showToast("Updated");
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save quote:", error);
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!quote || !confirm("Delete this quote?")) return;
    await deleteQuote(quote.id);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="animate-fade-in-up">
      <SaveError message={saveError} />
      <h1 className="text-3xl font-mono font-bold mb-6">Edit quote</h1>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="textarea textarea-ghost text-lg font-serif italic w-full mb-4 px-0 focus:outline-none resize-y max-h-[min(800px,100dvh)]"
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

      <div className="flex gap-3 mt-6 justify-between">
        <button
          onClick={handleDelete}
          className="btn btn-ghost btn-sm text-error"
        >
          Delete
        </button>
        <button
          onClick={save}
          disabled={saving || !body.trim()}
          className="btn btn-primary btn-sm"
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Update"
          )}
        </button>
      </div>
    </div>
  );
}
