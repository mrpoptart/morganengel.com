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

  // daisyUI dropdowns stay open while the trigger holds focus; blur on tap so
  // it closes after picking an item.
  const closeMenu = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-end gap-3 mb-8">
        <span className="text-sm text-base-content/50 hidden sm:inline truncate max-w-[35vw]">
          {user.email}
        </span>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-primary btn-sm">
            + New
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-200 rounded-box shadow-2xl mt-2 w-56 p-2 z-50"
          >
            <li>
              <Link href="/admin/new" onClick={closeMenu}>
                New Post
              </Link>
            </li>
            <li>
              <Link href="/admin/new-journal" onClick={closeMenu}>
                New Travel Journal
              </Link>
            </li>
            <li>
              <Link href="/admin/new-trip" onClick={closeMenu}>
                New Trip
              </Link>
            </li>
            <li>
              <Link href="/admin/new-quote" onClick={closeMenu}>
                New Quote
              </Link>
            </li>
            <li className="menu-title px-0 py-0">
              <div className="border-t border-base-content/10 my-1" />
            </li>
            <li>
              <Link href="/admin/import" onClick={closeMenu}>
                Import
              </Link>
            </li>
          </ul>
        </div>
        <button onClick={() => auth.signOut()} className="btn btn-ghost btn-sm">
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
