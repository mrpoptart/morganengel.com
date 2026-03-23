"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPostById, updatePost, deletePost } from "@/lib/posts";
import { Editor } from "@/components/Editor";
import type { Post } from "@/types/post";


export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const htmlRef = useRef("");

  useEffect(() => {
    getPostById(id).then((p) => {
      if (!p) {
        router.push("/admin");
        return;
      }
      setPost(p);
      setTitle(p.title);
      setSlug(p.slug);
      setTags(p.tags.join(", "));
      if (p.publishedAt) {
        const d = p.publishedAt.toDate();
        setPublishDate(d.toISOString().slice(0, 16));
      }
      htmlRef.current = p.content;
      setLoading(false);
    });
  }, [id, router]);

  const handleEditorUpdate = useCallback(
    (_json: unknown, html: string) => {
      htmlRef.current = html;
    },
    []
  );

  async function save(status?: "draft" | "published") {
    setSaving(true);
    try {
      await updatePost(id, {
        title: title.trim(),
        slug: slug.trim(),
        content: htmlRef.current,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        ...(status ? { status } : {}),
        ...(publishDate ? { publishedAt: new Date(publishDate) } : {}),
      });
      router.push("/admin");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}"?`)) return;
    await deletePost(id);
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="animate-fade-in-up">
      <input
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-ghost text-3xl font-mono font-bold w-full mb-2 px-0 focus:outline-none"
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-base-content/40 font-mono">/posts/</span>
        {editingSlug ? (
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setEditingSlug(false)}
            autoFocus
            className="input input-ghost input-xs font-mono px-0 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingSlug(true)}
            className="text-xs font-mono text-base-content/50 hover:text-primary transition-colors"
          >
            {slug} ✏️
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
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

      <Editor initialHTML={post.content} onUpdate={handleEditorUpdate} />

      <div className="flex gap-3 mt-6 justify-between">
        <button
          onClick={handleDelete}
          className="btn btn-ghost btn-sm text-error"
        >
          Delete
        </button>
        <div className="flex gap-3">
          {post.status === "published" ? (
            <>
              <button
                onClick={() => save("draft")}
                disabled={saving}
                className="btn btn-outline btn-sm"
              >
                Unpublish
              </button>
              <button
                onClick={() => save("published")}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Update"
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => save("draft")}
                disabled={saving}
                className="btn btn-outline btn-sm"
              >
                Save Draft
              </button>
              <button
                onClick={() => save("published")}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Publish"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
