"use client";

import { useEffect, useState, useCallback } from "react";
import { EyeIcon, HeartIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BlogStatsProps {
  slug: string;
}

export function BlogStats({ slug }: BlogStatsProps) {
  const [views, setViews] = useState<number>(0);
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("post_stats")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching stats:", error);
      } else if (data) {
        setViews(data.views);
        setLikes(data.likes);
      }
    } catch (error) {
      console.error("Error in fetchStats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  const incrementViews = useCallback(async () => {
    try {
      // Check if post stats exist
      const { data: existingData, error: fetchError } = await supabase
        .from("post_stats")
        .select("*")
        .eq("slug", slug)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching stats:", fetchError);
        setIsLoading(false);
        return;
      }

      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from("post_stats")
          .update({ views: existingData.views + 1 })
          .eq("slug", slug)
          .select()
          .single();

        if (error) {
          console.error("Error updating views:", error);
        } else if (data) {
          setViews(data.views);
          setLikes(data.likes);
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("post_stats")
          .insert({ slug, views: 1, likes: 0 })
          .select()
          .single();

        if (error) {
          console.error("Error creating stats:", error);
        } else if (data) {
          setViews(data.views);
          setLikes(data.likes);
        }
      }
    } catch (error) {
      console.error("Error in incrementViews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Check if user has already liked this post
    const likedPosts = JSON.parse(
      localStorage.getItem("likedPosts") || "{}"
    );
    setHasLiked(likedPosts[slug] || false);

    // Check if user has already viewed this post
    const viewedPosts = JSON.parse(
      localStorage.getItem("viewedPosts") || "{}"
    );
    
    if (!viewedPosts[slug]) {
      // First time viewing this post
      incrementViews();
      viewedPosts[slug] = true;
      localStorage.setItem("viewedPosts", JSON.stringify(viewedPosts));
    } else {
      // Already viewed, just fetch the current stats
      fetchStats();
    }
  }, [slug, incrementViews, fetchStats]);

  const toggleLike = async () => {
    if (hasLiked) return; // Prevent multiple likes

    try {
      const { data: existingData } = await supabase
        .from("post_stats")
        .select("likes")
        .eq("slug", slug)
        .single();

      if (existingData) {
        const newLikes = existingData.likes + 1;

        const { error } = await supabase
          .from("post_stats")
          .update({ likes: newLikes })
          .eq("slug", slug);

        if (error) {
          console.error("Error updating likes:", error);
        } else {
          setLikes(newLikes);
          setHasLiked(true);

          // Store in localStorage
          const likedPosts = JSON.parse(
            localStorage.getItem("likedPosts") || "{}"
          );
          likedPosts[slug] = true;
          localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
        }
      }
    } catch (error) {
      console.error("Error in toggleLike:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <EyeIcon className="h-4 w-4" />
          <span>---</span>
        </div>
        <div className="flex items-center gap-2">
          <HeartIcon className="h-4 w-4" />
          <span>---</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
        <EyeIcon className="h-4 w-4" />
        <span>{views} views</span>
      </div>
      <button
        onClick={toggleLike}
        disabled={hasLiked}
        className={`flex items-center gap-2 transition-colors ${
          hasLiked
            ? "text-red-500 cursor-default"
            : "text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
        }`}
        aria-label={hasLiked ? "Already liked" : "Like this post"}
      >
        <HeartIcon
          className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`}
        />
        <span>{likes} likes</span>
      </button>
    </div>
  );
}
