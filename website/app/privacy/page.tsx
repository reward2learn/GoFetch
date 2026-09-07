"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PublicRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/privacy");
  }, [router]);
  return null;
}
