"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Comment {
  id: number;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export function CommentsList({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("slug", slug)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch comments initially
    fetchComments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `slug=eq.${slug}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, fetchComments]);

  async function deleteComment(id: number) {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      alert("Failed to delete comment");
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Loading comments...</p>;
  }

  if (comments.length === 0) {
    return (
      <p className="text-zinc-500 italic">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-b border-zinc-200 dark:border-zinc-800 pb-4"
        >
          <p className="text-zinc-900 dark:text-zinc-100 mb-2">
            {comment.content}
          </p>
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>
              {comment.user_name} •{" "}
              {new Date(comment.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {session?.user.id === comment.user_id && (
              <button
                onClick={() => {
                  if (confirm("Delete this comment?")) {
                    deleteComment(comment.id);
                  }
                }}
                className="text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
