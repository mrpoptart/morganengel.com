"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function NewTripButton() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <Link href="/admin/new-trip" className="btn btn-primary btn-sm">
      New Trip
    </Link>
  );
}
