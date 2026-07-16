"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AdminEditLink({
  slug,
  basePath = "/admin/edit",
}: {
  slug: string;
  basePath?: string;
}) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  return (
    <>
      <span>&middot;</span>
      <Link
        href={`${basePath}/${slug}`}
        className="hover:text-primary transition-colors"
      >
        Edit
      </Link>
    </>
  );
}
