"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Special route just for Ben - redirects to /share/ben
export default function BenPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual share page
    router.replace("/share/ben");
  }, [router]);

  // Show nothing while redirecting
  return null;
}
