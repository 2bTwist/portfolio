"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export function CommentForm({ slug }: { slug: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function submitComment() {
    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (!session?.user) {
      setError("You must be logged in to comment");
      return;
    }

    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("comments").insert({
      slug,
      content: content.trim(),
      user_id: session.user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setContent("");
    setLoading(false);
  }

  if (!session) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm italic my-6">
        Please sign in to leave a comment.
      </p>
    );
  }

  return (
    <div className="my-8">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError("");
        }}
        placeholder="Write a comment..."
        rows={4}
        className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        onClick={submitComment}
        disabled={loading || !content.trim()}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
}
