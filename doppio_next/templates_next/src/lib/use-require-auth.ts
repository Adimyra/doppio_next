"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "frappe-react-sdk";

/** Client-side auth guard for pages behind login. */
export function useRequireAuth() {
  const router = useRouter();
  const { currentUser, isLoading } = useFrappeAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  return { currentUser, isLoading };
}
