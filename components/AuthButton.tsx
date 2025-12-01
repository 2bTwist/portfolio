"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setShowAuth(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm mb-6">
        <span className="text-zinc-600 dark:text-zinc-400">
          Signed in as {session.user.user_metadata?.name || session.user.user_metadata?.user_name || "User"}
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!showAuth) {
    return (
      <button
        onClick={() => setShowAuth(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
      >
        Sign in to comment
      </button>
    );
  }

  // Use current domain for redirect (works in both dev and production)
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg mb-6 max-w-md">
      <button
        onClick={() => setShowAuth(false)}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
      >
        ✕ Close
      </button>
      <Auth
        supabaseClient={supabase}
        providers={["github", "google"]}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        redirectTo={redirectTo}
      />
    </div>
  );
}
