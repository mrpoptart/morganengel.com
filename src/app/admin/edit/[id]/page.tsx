"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPostById, getPostBySlug, updatePost, deletePost } from "@/lib/posts";
import { Editor } from "@/components/Editor";
import { TagsInput } from "@/components/TagsInput";
import type { Post } from "@/types/post";


export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const idOrSlug = params.id as string;

  const [postId, setPostId] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const htmlRef = useRef("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      let p = await getPostById(idOrSlug);
      if (!p) {
        p = await getPostBySlug(idOrSlug);
      }
      if (!p) {
        router.push("/admin");
        return;
      }
      setPostId(p.id);
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
      // Delay setting loadedRef so initial state changes don't trigger autosave
      setTimeout(() => { loadedRef.current = true; }, 100);
    }
    load();
  }, [idOrSlug, router]);

  const triggerAutosave = useCallback(() => {
    if (!postId || post?.status === "published") return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setAutoSaved(false);
    autosaveTimer.current = setTimeout(async () => {
      await updatePost(postId, {
        title: title.trim(),
        slug: slug.trim(),
        content: htmlRef.current,
        tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      });
      setAutoSaved(true);
    }, 2000);
  }, [postId, post?.status, title, slug, tags]);

  // Autosave on title/tags changes
  useEffect(() => {
    if (!loadedRef.current) return;
    triggerAutosave();
  }, [title, tags, triggerAutosave]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const handleEditorUpdate = useCallback(
    (_json: unknown, html: string) => {
      htmlRef.current = html;
      if (loadedRef.current) triggerAutosave();
    },
    [triggerAutosave]
  );

  async function save(status?: "draft" | "published") {
    if (!postId) return;
    setSaving(true);
    try {
      await updatePost(postId, {
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
    if (!postId || !confirm(`Delete "${title}"?`)) return;
    await deletePost(postId);
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

      <Editor initialHTML={post.content} onUpdate={handleEditorUpdate} />

      <div className="flex gap-3 mt-6 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="btn btn-ghost btn-sm text-error"
          >
            Delete
          </button>
          {post.status === "draft" && autoSaved && (
            <span className="text-xs text-base-content/40 font-mono">Saved</span>
          )}
        </div>
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
