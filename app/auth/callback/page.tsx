"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect_to") ?? "/";

  useEffect(() => {
    // Give the Supabase client a moment to initialize and parse the URL fragment
    const t = setTimeout(async () => {
      try {
        // Calling getSession after the page mounts allows the Supabase client
        // to read the URL hash fragment (access_token...) and persist the session.
        await supabase.auth.getSession();
      } catch (err) {
        // ignore - we'll redirect anyway
      } finally {
        router.replace(redirectTo);
      }
    }, 50);

    return () => clearTimeout(t);
  }, [redirectTo, router]);

  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <p className="text-zinc-700 dark:text-zinc-300">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-8 text-center">Loading…</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
