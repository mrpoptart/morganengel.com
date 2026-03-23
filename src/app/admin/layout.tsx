"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-end mb-8">
        <div className="flex items-center gap-4">
          <span className="text-sm text-base-content/50">{user.email}</span>
          <Link href="/admin/new" className="btn btn-primary btn-sm">
            New Post
          </Link>
          <button
            onClick={() => auth.signOut()}
            className="btn btn-ghost btn-sm"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
