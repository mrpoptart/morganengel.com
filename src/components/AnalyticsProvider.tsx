"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    analytics.then((a) => {
      if (a) {
        logEvent(a, "page_view", {
          page_path: pathname,
          page_search: searchParams.toString(),
        });
      }
    });
  }, [pathname, searchParams]);

  return null;
}
