"use client";

import { supabase } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    if (!showAuth) {
      return (
        <button
          onClick={() => setShowAuth(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Sign in to comment
        </button>
      );
    }

    // Get current URL for redirect after auth
    const currentUrl = typeof window !== "undefined" ? `${window.location.pathname}#comments` : "/";
    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentUrl)}`
      : "/auth/callback";

    return (
      <div className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg max-w-md bg-white dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Sign in to comment</h3>
          <button
            onClick={() => setShowAuth(false)}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={["google", "github"]}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          redirectTo={redirectUrl}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">
        Signed in as {session.user.email}
      </span>
      <button
        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        onClick={() => supabase.auth.signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
