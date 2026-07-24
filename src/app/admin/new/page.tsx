"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/posts";
import { Editor } from "@/components/Editor";
import { TagsInput } from "@/components/TagsInput";
import { useAuth } from "@/components/AuthProvider";
import { SaveError, formatSaveError } from "@/components/SaveError";
import { useToast } from "@/components/ToastProvider";
import type { JSONContent } from "novel";

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const htmlRef = useRef("");

  const handleEditorUpdate = useCallback(
    (_json: JSONContent, html: string) => {
      htmlRef.current = html;
    },
    []
  );

  async function save(status: "draft" | "published") {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const id = await createPost({
        title: title.trim(),
        content: htmlRef.current,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        status,
        ...(user?.displayName || user?.email
          ? { author: user.displayName ?? user.email ?? undefined }
          : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      showToast(status === "published" ? "Published" : "Draft saved");
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveError(formatSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <SaveError message={saveError} />
      <input
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-4 px-0 focus:outline-none"
      />

      <TagsInput
        value={tags}
        onChange={setTags}
        className="input input-ghost text-sm font-mono w-full mb-4 px-0 text-base-content/50 focus:outline-none"
      />

      <div className="flex items-center gap-2 mb-6">
        <label className="text-xs text-base-content/40 font-mono">Publish date:</label>
        <input
          type="datetime-local"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          className="input input-ghost input-sm font-mono text-sm text-base-content/50 focus:outline-none"
        />
      </div>

      <Editor onUpdate={handleEditorUpdate} />

      <div className="flex gap-3 mt-6 justify-end">
        <button
          onClick={() => save("draft")}
          disabled={saving || !title.trim()}
          className="btn btn-outline btn-sm"
        >
          {saving ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Save Draft"
          )}
        </button>
        <button
          onClick={() => save("published")}
          disabled={saving || !title.trim()}
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
