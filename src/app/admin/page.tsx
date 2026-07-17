"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllPosts, deletePost } from "@/lib/posts";
import { getQuotes, deleteQuote } from "@/lib/quotes";
import { getAllJournal, deleteJournal } from "@/lib/journal";
import { getAllTrips, deleteTrip } from "@/lib/trips";
import type { Post } from "@/types/post";
import type { Quote } from "@/types/quote";
import type { JournalEntry } from "@/types/journal";
import type { Trip } from "@/types/trip";
import type { Timestamp } from "firebase/firestore";

type Row =
  | { kind: "post"; data: Post; sortKey: number }
  | { kind: "quote"; data: Quote; sortKey: number }
  | { kind: "journal"; data: JournalEntry; sortKey: number }
  | { kind: "trip"; data: Trip; sortKey: number };

function tsToMillis(ts: Timestamp | null | undefined): number {
  return ts?.toMillis?.() ?? 0;
}

function quotePreview(body: string, max = 60): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export default function AdminDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllPosts(), getQuotes(), getAllJournal(), getAllTrips()]).then(
      ([posts, quotes, journal, trips]) => {
        const merged: Row[] = [
          ...posts.map<Row>((p) => ({
            kind: "post",
            data: p,
            // Drafts (no publishedAt) sort to the top
            sortKey:
              p.status === "draft"
                ? Number.POSITIVE_INFINITY
                : tsToMillis(p.publishedAt),
          })),
          ...quotes.map<Row>((q) => ({
            kind: "quote",
            data: q,
            sortKey: tsToMillis(q.publishedAt),
          })),
          ...journal.map<Row>((j) => ({
            kind: "journal",
            data: j,
            sortKey:
              j.status === "draft"
                ? Number.POSITIVE_INFINITY
                : tsToMillis(j.publishedAt),
          })),
          ...trips.map<Row>((t) => ({
            kind: "trip",
            data: t,
            sortKey:
              t.status === "draft"
                ? Number.POSITIVE_INFINITY
                : tsToMillis(t.publishedAt),
          })),
        ].sort((a, b) => b.sortKey - a.sortKey);
        setRows(merged);
        setLoading(false);
      }
    );
  }, []);

  async function handleDeletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await deletePost(id);
    setRows((prev) =>
      prev.filter((r) => !(r.kind === "post" && r.data.id === id))
    );
  }

  async function handleDeleteQuote(id: string) {
    if (!confirm("Delete this quote?")) return;
    await deleteQuote(id);
    setRows((prev) =>
      prev.filter((r) => !(r.kind === "quote" && r.data.id === id))
    );
  }

  async function handleDeleteJournal(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteJournal(id);
    setRows((prev) =>
      prev.filter((r) => !(r.kind === "journal" && r.data.id === id))
    );
  }

  async function handleDeleteTrip(id: string, title: string) {
    if (!confirm(`Delete "${title}"? Entries in it will be kept.`)) return;
    await deleteTrip(id);
    setRows((prev) =>
      prev.filter((r) => !(r.kind === "trip" && r.data.id === id))
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
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
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "trip" ? (
                <tr key={`trip-${row.data.id}`} className="hover">
                  <td>
                    <span className="badge badge-sm badge-secondary badge-outline">
                      trip
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/edit-trip/${row.data.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {row.data.title || "Untitled"}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        row.data.status === "published"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {row.data.status}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/50 font-mono">
                    {row.data.publishedAt?.toDate?.()
                      ? row.data.publishedAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/edit-trip/${row.data.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteTrip(row.data.id, row.data.title)
                        }
                        className="btn btn-ghost btn-xs text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ) : row.kind === "journal" ? (
                <tr key={`journal-${row.data.id}`} className="hover">
                  <td>
                    <span className="badge badge-sm badge-primary badge-outline">
                      journal
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/edit-journal/${row.data.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {row.data.title || "Untitled"}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        row.data.status === "published"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {row.data.status}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/50 font-mono">
                    {row.data.publishedAt?.toDate?.()
                      ? row.data.publishedAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/edit-journal/${row.data.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteJournal(row.data.id, row.data.title)
                        }
                        className="btn btn-ghost btn-xs text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ) : row.kind === "post" ? (
                <tr key={`post-${row.data.id}`} className="hover">
                  <td>
                    <span className="badge badge-sm badge-ghost">post</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/edit/${row.data.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {row.data.title || "Untitled"}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        row.data.status === "published"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {row.data.status}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/50 font-mono">
                    {row.data.publishedAt?.toDate?.()
                      ? row.data.publishedAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/edit/${row.data.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDeletePost(row.data.id, row.data.title)
                        }
                        className="btn btn-ghost btn-xs text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={`quote-${row.data.id}`} className="hover">
                  <td>
                    <span className="badge badge-sm badge-outline">quote</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/edit-quote/${row.data.id}`}
                      className="italic text-base-content/70 hover:text-primary transition-colors"
                    >
                      {quotePreview(row.data.body)}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-sm badge-success">
                      published
                    </span>
                  </td>
                  <td className="text-sm text-base-content/50 font-mono">
                    {row.data.publishedAt?.toDate?.()
                      ? row.data.publishedAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/edit-quote/${row.data.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteQuote(row.data.id)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
