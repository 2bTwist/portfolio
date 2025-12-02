"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export function CommentForm({ slug }: { slug: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (!session || !content.trim()) return;

    setLoading(true);

    // Extract name from user metadata - use same logic as AuthButton display
    const userName =
      session.user.user_metadata?.name ||
      session.user.user_metadata?.user_name ||
      session.user.user_metadata?.full_name ||
      "Anonymous";

    const { error } = await supabase.from("comments").insert({
      slug,
      user_id: session.user.id,
      user_name: userName,
      content: content.trim(),
    });

    setLoading(false);

    if (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } else {
      setContent(""); // Clear the form immediately after successful post
    }
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mb-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={4}
        className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
}
