"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  user_display_name: string;
}

export function CommentsList({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchComments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`comments:${slug}`)
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
  }, [slug]);

  async function fetchComments() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, user_display_name")
      .eq("slug", slug)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    setComments(data || []);
    setLoading(false);
  }

  async function deleteComment(id: number) {
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  }

  if (loading) {
    return (
      <div className="text-zinc-500 dark:text-zinc-400 text-sm my-6">
        Loading comments...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-zinc-500 dark:text-zinc-400 text-sm italic my-6">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-medium mb-4">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-b border-zinc-200 dark:border-zinc-800 pb-4 last:border-0"
        >
          <p className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
            {comment.content}
          </p>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            <span>
              {comment.user_display_name} •{" "}
              {new Date(comment.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {session?.user?.id === comment.user_id && (
              <button
                onClick={() => {
                  if (confirm("Delete this comment?")) {
                    deleteComment(comment.id);
                  }
                }}
                className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Delete comment"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
