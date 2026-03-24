"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllPosts, deletePost } from "@/lib/posts";
import type { Post } from "@/types/post";

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPosts().then((p) => {
      p.sort((a, b) => {
        if (a.status === "draft" && b.status !== "draft") return -1;
        if (a.status !== "draft" && b.status === "draft") return 1;
        return 0;
      });
      setPosts(p);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <p className="text-base-content/50 mb-4">No posts yet.</p>
        <Link href="/admin/new" className="btn btn-primary">
          Write your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="hover">
                <td>
                  <Link
                    href={`/admin/edit/${post.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {post.title || "Untitled"}
                  </Link>
                </td>
                <td>
                  <span
                    className={`badge badge-sm ${
                      post.status === "published"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="text-sm text-base-content/50 font-mono">
                  {post.publishedAt?.toDate?.()
                    ? post.publishedAt.toDate().toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
