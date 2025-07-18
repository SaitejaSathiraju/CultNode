"use client";
import { use, useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import UserCard from "../../../components/UserCard";
import { supabase } from "../../../utils/supabaseClient";
import { toast, Toaster } from 'react-hot-toast';

// Define minimal types for movie, review, user, and comment
interface Movie {
  id: string;
  slug: string;
  [key: string]: any;
}
interface Review {
  id: string;
  user_id: string;
  users?: User;
  [key: string]: any;
}
interface User {
  id: string;
  username?: string;
  avatar_url?: string;
  clerk_id?: string;
  [key: string]: any;
}
interface Comment {
  id: string;
  user_id: string;
  users?: User;
  [key: string]: any;
}

export default function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useUser();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSupabaseId, setUserSupabaseId] = useState<string | null>(null);
  const [userSyncLoading, setUserSyncLoading] = useState(true);

  // User review form state
  const [userReviewText, setUserReviewText] = useState("");
  const [userReviewRating, setUserReviewRating] = useState<number | null>(null);
  const [userReviewSubmitting, setUserReviewSubmitting] = useState(false);
  const [userReviewError, setUserReviewError] = useState<string | null>(null);

  // All reviews for this movie
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [adminReview, setAdminReview] = useState<Review | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);

  const adminReviewRef = useRef<HTMLDivElement>(null);
  const userReviewRefs = useRef<HTMLDivElement[]>([]);
  const exportCardContainerRef = useRef<HTMLDivElement>(null);

  // Fetch movie data
  useEffect(() => {
    async function fetchMovie() {
      const { data, error } = await supabase.from("movies").select("*").eq("slug", slug).single();
      if (error || !data) {
        setMovie(null);
        setLoading(false);
        return;
      }
      setMovie(data);
      setLoading(false);
    }
    fetchMovie();
  }, [slug]);

  // Fetch user Supabase ID
  useEffect(() => {
    async function fetchUserSupabaseId() {
      if (!user) return;
      setUserSyncLoading(true);
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (userRow) setUserSupabaseId(userRow.id);
      setUserSyncLoading(false);
    }
    fetchUserSupabaseId();
  }, [user]);

  // Fetch all reviews for this movie
  useEffect(() => {
    async function fetchReviews() {
      if (!movie?.id) return;
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(username, avatar_url, clerk_id)")
        .eq("content_type", "movie")
        .eq("content_id", movie.id)
        .order("created_at", { ascending: false });
      if (data) {
        setAllReviews(data);
        // Admin review: first review where users.clerk_id is admin (or use a flag/role if you have it)
        const admin = data.find((r: Review) => r.users?.clerk_id === "admin" || r.users?.username === "admin");
        setAdminReview(admin || null);
        setUserReviews(data.filter((r: Review) => !admin || r.id !== admin.id));
        if (userSupabaseId) {
          setMyReview(data.find((r: Review) => r.user_id === userSupabaseId));
        }
      }
    }
    fetchReviews();
  }, [movie?.id, userSupabaseId]);

  // User review submit handler
  async function handleSubmitUserReview(e: React.FormEvent) {
    e.preventDefault();
    setUserReviewError(null);
    if (!user) {
      toast.error('Please login to rate or review.');
      return;
    }
    if (!movie) return;
    if (!userReviewText.trim() || !userReviewRating) {
      setUserReviewError("Please provide both a rating and review text.");
      return;
    }
    setUserReviewSubmitting(true);
    // Fetch the user's Supabase UUID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!userRow) {
      setUserReviewError("Could not find user in Supabase.");
      setUserReviewSubmitting(false);
      return;
    }
    const userSupabaseId = userRow.id;
    // Upsert review (one per user per movie)
    const { error } = await supabase.from("reviews").upsert([
      {
        user_id: userSupabaseId,
        content_type: "movie",
        content_id: movie.id,
        rating: userReviewRating,
        review_text: userReviewText.trim(),
      }
    ], { onConflict: "user_id,content_type,content_id" });
    if (error) {
      setUserReviewError("Failed to submit review: " + error.message);
      setUserReviewSubmitting(false);
      return;
    }
    setUserReviewText("");
    setUserReviewRating(null);
    setUserReviewSubmitting(false);
    // Refresh reviews
    const { data: newReviews } = await supabase
      .from("reviews")
      .select("*, users(username, avatar_url, clerk_id)")
      .eq("content_type", "movie")
      .eq("content_id", movie.id)
      .order("created_at", { ascending: false });
    if (newReviews) {
      setAllReviews(newReviews);
      const admin = newReviews.find((r: Review) => r.users?.clerk_id === "admin" || r.users?.username === "admin");
      setAdminReview(admin || null);
      setUserReviews(newReviews.filter((r: Review) => !admin || r.id !== admin.id));
      if (userSupabaseId) {
        setMyReview(newReviews.find((r: Review) => r.user_id === userSupabaseId));
      }
    }
  }

  // Delete user review
  async function handleDeleteUserReview(reviewId: string) {
    await supabase.from("reviews").delete().eq("id", reviewId);
    // Refresh reviews
    if (movie?.id) {
      const { data: newReviews } = await supabase
        .from("reviews")
        .select("*, users(username, avatar_url, clerk_id)")
        .eq("content_type", "movie")
        .eq("content_id", movie.id)
        .order("created_at", { ascending: false });
      if (newReviews) {
        setAllReviews(newReviews);
        const admin = newReviews.find((r: Review) => r.users?.clerk_id === "admin" || r.users?.username === "admin");
        setAdminReview(admin || null);
        setUserReviews(newReviews.filter((r: Review) => !admin || r.id !== admin.id));
        if (userSupabaseId) {
          setMyReview(newReviews.find((r: Review) => r.user_id === userSupabaseId));
        }
      }
    }
  }

  // Fetch ratings
  useEffect(() => {
    async function fetchRatings() {
      if (!movie?.id || !user) return;
      // Fetch all ratings for this movie
      const { data: allRatings, error: ratingsError } = await supabase
        .from("ratings")
        .select("user_id, rating")
        .eq("content_type", "movie")
        .eq("content_id", movie.id);
      if (!allRatings) return;
      const ratingsArr = allRatings.map((r: any) => r.rating);
      setRatingsCount(ratingsArr.length);
      if (ratingsArr.length) {
        setAvgRating((ratingsArr.reduce((a: number, b: number) => a + b, 0) / ratingsArr.length).toFixed(1));
      } else {
        setAvgRating(null);
      }
      // Fetch the user's Supabase UUID
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (userRow) {
        const userSupabaseId = userRow.id;
        const userRatingObj = allRatings.find((r: any) => r.user_id === userSupabaseId);
        setUserRating(userRatingObj ? userRatingObj.rating : null);
      }
    }
    fetchRatings();
  }, [movie?.id, user]);

  useEffect(() => {
    async function fetchUserSupabaseId() {
      if (!user) return;
      setUserSyncLoading(true);
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (userRow) setUserSupabaseId(userRow.id);
      setUserSyncLoading(false);
    }
    fetchUserSupabaseId();
  }, [user]);

  // Fix handleVote to use Supabase UUID and error handling
  async function handleVote(rating: number) {
    if (!user) {
      toast.error('Please login to rate or review.');
      return;
    }
    if (!movie) return;
    // Fetch the user's Supabase UUID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!userRow) {
      toast.error("Could not find user in Supabase.");
      return;
    }
    const userSupabaseId = userRow.id;
    // Upsert rating
    const { error } = await supabase.from("ratings").upsert([
      {
        user_id: userSupabaseId,
        content_type: "movie",
        content_id: movie.id,
        rating,
      }
    ], { onConflict: "user_id,content_type,content_id" });
    if (error) {
      toast.error("Failed to submit rating: " + error.message);
      return;
    }
    setUserRating(rating);
    // Refresh ratings
    const { data: allRatings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("content_type", "movie")
      .eq("content_id", movie.id);
    if (allRatings) {
      const ratingsArr = allRatings.map((r: any) => r.rating);
      setRatingsCount(ratingsArr.length);
      setAvgRating(ratingsArr.length ? (ratingsArr.reduce((a: number, b: number) => a + b, 0) / ratingsArr.length).toFixed(1) : null);
    }
  }

  const [commentsLimit, setCommentsLimit] = useState(10);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*, users(username, avatar_url)")
        .eq("content_type", "movie")
        .eq("content_id", movie?.id)
        .order("created_at", { ascending: true })
        .limit(commentsLimit);
      if (data) {
        setComments(data);
        setAllCommentsLoaded(data.length < commentsLimit);
      }
    }
    if (movie?.id) fetchComments();
  }, [movie?.id, commentsLimit]);

  // Handle add comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to rate or review.');
      return;
    }
    if (!commentText.trim() || !movie) return;
    (async () => {
      // Fetch the user's UUID from Supabase using their Clerk ID
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (userError || !userRow) {
        toast.error("Could not find user in Supabase.");
        return;
      }
      const userId = userRow.id;
      const { error } = await supabase.from("comments").insert({
        user_id: userId,
        content_type: "movie",
        content_id: movie.id,
        parent_id: replyTo,
        text: commentText.trim(),
      });
      if (error) {
        toast.error("Failed to post comment: " + error.message);
        return;
      }
      setCommentText("");
      setReplyTo(null);
      setCommentsLimit(10); // Reset to first page after new comment
      // Refresh comments
      const { data } = await supabase
        .from("comments")
        .select("*, users(username, avatar_url)")
        .eq("content_type", "movie")
        .eq("content_id", movie.id)
        .order("created_at", { ascending: true })
        .limit(10);
      if (data) {
        setComments(data);
        setAllCommentsLoaded(data.length < 10);
      }
    })();
  }

  // Delete comment (owner only)
  async function handleDeleteComment(commentId: string) {
    if (!user) return;
    // Fetch the user's Supabase UUID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!userRow) return;
    const userSupabaseId = userRow.id;
    // Only allow delete if the comment belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();
    if (comment && comment.user_id === userSupabaseId) {
      await supabase.from("comments").delete().eq("id", commentId);
      // Refresh comments
      if (movie?.id) {
        const { data } = await supabase
          .from("comments")
          .select("*, users(username, avatar_url)")
          .eq("content_type", "movie")
          .eq("content_id", movie.id)
          .order("created_at", { ascending: true });
        if (data) setComments(data);
      }
    }
  }

  // Delete rating
  async function handleDeleteRating() {
    if (!user || !movie) return;
    // Fetch the user's Supabase UUID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!userRow) return;
    const userSupabaseId = userRow.id;
    await supabase.from("ratings").delete().eq("user_id", userSupabaseId).eq("content_type", "movie").eq("content_id", movie.id);
    setUserRating(null);
    // Refresh ratings
    if (movie?.id) {
      const { data: allRatings } = await supabase
        .from("ratings")
        .select("rating")
        .eq("content_type", "movie")
        .eq("content_id", movie.id);
      if (allRatings) {
        const ratingsArr = allRatings.map((r: any) => r.rating);
        setRatingsCount(ratingsArr.length);
        setAvgRating(ratingsArr.length ? (ratingsArr.reduce((a: number, b: number) => a + b, 0) / ratingsArr.length).toFixed(1) : null);
      }
    }
  }

  // Fetch reviews for this movie (only for this movie)
  // const [reviews, setReviews] = useState<any[]>([]); // This state is no longer needed
  // useEffect(() => {
  //   async function fetchReviews() {
  //     if (!movie?.id) return;
  //     const { data, error } = await supabase
  //       .from("reviews")
  //       .select("*, users(username, avatar_url)")
  //       .eq("content_type", "movie")
  //       .eq("content_id", movie.id)
  //       .order("created_at", { ascending: false });
  //     if (data) setReviews(data);
  //   }
  //   fetchReviews();
  // }, [movie?.id]);

  // Add review submit handler
  // async function handleSubmitReview(e: React.FormEvent) {
  //   e.preventDefault();
  //   setReviewError(null);
  //   if (!user || !movie) return;
  //   if (!reviewText.trim() || !reviewRating) {
  //     setReviewError("Please provide both a rating and review text.");
  //     return;
  //   }
  //   setReviewSubmitting(true);
  //   // Fetch the user's Supabase UUID
  //   const { data: userRow, error: userError } = await supabase
  //     .from("users")
  //     .select("id")
  //     .eq("clerk_id", user.id)
  //     .single();
  //   if (!userRow) {
  //     setReviewError("Could not find user in Supabase.");
  //     setReviewSubmitting(false);
  //     return;
  //   }
  //   const userSupabaseId = userRow.id;
  //   // Upsert review (one per user per movie)
  //   const { error } = await supabase.from("reviews").upsert([
  //     {
  //       user_id: userSupabaseId,
  //       content_type: "movie",
  //       content_id: movie.id,
  //       rating: reviewRating,
  //       review_text: reviewText.trim(),
  //     }
  //   ], { onConflict: "user_id,content_type,content_id" });
  //   if (error) {
  //     setReviewError("Failed to submit review: " + error.message);
  //     setReviewSubmitting(false);
  //     return;
  //   }
  //   setReviewText("");
  //   setReviewRating(null);
  //   setReviewSubmitting(false);
  //   // Refresh reviews
  //   const { data: newReviews } = await supabase
  //     .from("reviews")
  //     .select("*, users(username, avatar_url)")
  //     .eq("content_type", "movie")
  //     .eq("content_id", movie.id)
  //     .order("created_at", { ascending: false });
  //   if (newReviews) setReviews(newReviews);
  // }

  function renderComments(parentId: string | null = null, level = 0, userSupabaseIdArg: string | null = null) {
    return comments
      .filter(c => c.parent_id === parentId)
      .map((c, i) => (
        <div key={c.id} className={`flex items-start gap-3 bg-card rounded-lg p-3 mb-2 ml-[${level * 24}px]`} style={{ marginLeft: level ? level * 24 : 0 }}>
          <UserCard avatarUrl={c.users?.avatar_url || ''} username={c.users?.username || 'Unknown'} />
          <div className="flex-1">
            <div className="text-secondary mb-1">{c.text}</div>
            <div className="text-xs text-secondary mb-1">{new Date(c.created_at).toLocaleString()}</div>
            <div className="flex gap-2 items-center">
              <button className="text-xs text-accent hover:underline" onClick={() => setReplyTo(c.id)}>Reply</button>
              {userSupabaseIdArg && c.user_id === userSupabaseIdArg && (
                <button className="text-xs text-red-400 hover:underline" onClick={() => handleDeleteComment(c.id)} title="Delete your comment">Delete</button>
              )}
            </div>
            {renderComments(c.id, level + 1, userSupabaseIdArg)}
          </div>
        </div>
      ));
  }

  // Refactor the handler:
  const handleDownloadCard = async (review: Review, movie: Movie) => {
    // Helper to fetch an image and return a base64 data URL
    async function toBase64(url: string, fallback: string) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('Image fetch failed');
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        // fallback to local placeholder
        const res = await fetch(fallback);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
    const avatarUrl = await toBase64(review.users?.avatar_url || '', '/file.svg');
    const posterUrl = await toBase64(movie.poster || '', '/file.svg');

    // Full HD dimensions and scale factor
    const CARD_WIDTH = 1920;
    const CARD_HEIGHT = 1080;
    const SCALE = 2; // html2canvas scale
    // All style values are ~4.5x the original (for 1920px width)

    // Create a hidden export card (HD dark/clean style)
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    container.innerHTML = `
      <div style="
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        background: #18181b;
        color: #fff;
        border-radius: 48px;
        padding: 56px;
        box-shadow: 0 16px 96px rgba(0,0,0,0.18);
        border: 12px solid #ff7a1a;
        font-family: 'Inter', Arial, sans-serif;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        <div style="display: flex; align-items: center; gap: 24px; width: 100%; margin-bottom: 16px;">
          <img src='${avatarUrl}' alt='avatar' style="width: 192px; height: 192px; border-radius: 50%; border: 8px solid #ff7a1a; object-fit: cover; background: #222;" />
          <span style="font-weight: 700; font-size: 44px; color: #fff;">${review.users?.username || 'User'}</span>
          <span style="margin-left: auto; color: #ff7a1a; font-weight: 700; font-size: 60px;">${review.rating}/10</span>
        </div>
        <div style="font-weight: 700; font-size: 48px; margin: 16px 0 8px; text-align: center; color: #fff;">${movie.title}</div>
        <div style="font-size: 32px; color: #ff7a1a; text-align: center; margin-bottom: 16px;">${movie.year} &middot; ${movie.segment}</div>
        <div style="color: #fff; text-align: center; margin-bottom: 30px; font-size: 36px;">${review.review_text}</div>
        <img src='${posterUrl}' alt='${movie.title}' style="width: 384px; height: 528px; object-fit: cover; border-radius: 30px; margin: 20px auto; display: block; border: 8px solid #ff7a1a; background: #222;" />
        <div style="font-size: 24px; color: #bbb; margin-top: 16px; text-align: center;">${new Date(review.created_at).toLocaleDateString()}</div>
        <div style="position: absolute; top: 40px; right: 60px; font-size: 32px; color: #ff7a1a; font-weight: 700; opacity: 0.7; user-select: none;">CultNode</div>
      </div>
    `;

    // Wait for images to load
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (!img.complete) {
        return new Promise(resolve => {
          img.onload = img.onerror = resolve;
        });
      }
      return Promise.resolve();
    }));

    const html2canvas = (await import("html2canvas")).default;
    const cardDiv = container.firstElementChild as HTMLDivElement;
    const canvas = await html2canvas(cardDiv, { backgroundColor: null, scale: SCALE });
    const link = document.createElement("a");
    link.download = `review-card-${movie?.slug || "movie"}-hd.png`;
    link.href = canvas.toDataURL();
    link.click();
    document.body.removeChild(container);
  };

  if (loading) return <div className="max-w-3xl w-full mx-auto p-8 text-center text-gray-400">Loading...</div>;
  if (!movie) return notFound();

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 bg-card rounded-xl shadow-soft border border-soft">
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <img src={movie?.poster ?? ''} alt={movie?.title ?? ''} className="w-full sm:w-64 h-80 object-cover rounded-lg border border-soft" />
          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-3xl font-bold mb-1 text-accent">{movie?.title} {movie?.release_date ? <span className="text-lg text-secondary">({new Date(movie.release_date).getFullYear()})</span> : null}</h1>
            <div className="text-xs text-secondary mb-1">{movie?.segment}</div>
            <div className="text-sm text-secondary">{movie?.description}</div>
            <div className="text-xs text-secondary mt-2">Genres: {movie?.genres?.join(", ")}</div>
          </div>
        </div>
        {/* Trailer section */}
        {movie?.trailer && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2 text-accent">Trailer</h2>
            <div className="aspect-w-16 aspect-h-9 w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-soft">
              {movie.trailer.includes('youtube.com') || movie.trailer.includes('youtu.be') ? (
                <iframe
                  src={movie.trailer.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  title="Movie Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <iframe
                  src={movie.trailer}
                  title="Movie Trailer"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        )}
        {/* Poll for rating */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-accent">Rate this Movie</h2>
          <div className="flex items-center gap-2 mb-2">
            {[1,2,3,4,5,6,7,8,9,10].map(r => (
              <button
                key={r}
                className={`w-8 h-8 rounded-full font-bold border-2 ${userRating === r ? "bg-accent text-white border-accent" : "bg-card text-accent border-soft hover:bg-accent hover:text-white"}`}
                onClick={() => handleVote(r)}
              >
                {r}
              </button>
            ))}
            {userRating && (
              <button className="ml-4 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700" onClick={handleDeleteRating} title="Delete your rating">Delete Rating</button>
            )}
          </div>
          {userRating && <div className="text-green-600 text-sm mb-1">You rated: {userRating}/10</div>}
          {avgRating && <div className="text-accent text-sm">Average rating: {avgRating} ({ratingsCount} user{ratingsCount !== 1 ? "s" : ""} rated)</div>}
        </div>
        {/* Reviews section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-accent">Featured Review</h2>
          {!adminReview && <div className="text-secondary">No review yet.</div>}
          {adminReview && (
            <div ref={adminReviewRef} className="bg-card rounded-2xl shadow-soft p-6 flex flex-col gap-3 items-center max-w-lg mx-auto border border-soft relative">
              <div className="flex items-center gap-3 w-full">
                <UserCard avatarUrl={String(adminReview.users?.avatar_url || "")} username={String(adminReview.users?.username || "Admin")} />
                <span className="ml-auto text-accent font-bold text-xl">{adminReview.rating}/10</span>
              </div>
              <div className="font-bold text-lg text-center text-foreground">{movie?.title}</div>
              <div className="text-xs text-secondary mb-2 text-center">{movie?.year} &middot; {movie?.segment}</div>
              <div className="text-secondary text-center mb-2">{adminReview.review_text}</div>
              <img src={String(movie?.poster || "")} alt={String(movie?.title || "")} className="w-32 h-44 object-cover rounded-xl mx-auto border border-soft" />
              <div className="text-xs text-secondary mt-2">{new Date(adminReview.created_at).toLocaleDateString()}</div>
              <div className="absolute top-3 right-3 text-xs text-accent font-bold opacity-60 select-none">CultNode</div>
              <button
                onClick={() => handleDownloadCard(adminReview, movie)}
                className="mt-4 px-6 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white shadow-soft transition"
              >
                Download Card
              </button>
            </div>
          )}
        </div>
        {/* User Reviews section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-accent">Your Review</h2>
          {!myReview && <div className="text-secondary">You have not submitted a review yet.</div>}
          {myReview && (
            <div className="bg-card rounded-2xl shadow-soft p-6 flex flex-col gap-3 items-center max-w-lg mx-auto border border-soft mb-4 relative">
              <div className="flex items-center gap-3 w-full">
                <UserCard avatarUrl={String(myReview.users?.avatar_url || "")} username={String(myReview.users?.username || "You")} />
                <span className="ml-auto text-accent font-bold text-xl">{myReview.rating}/10</span>
              </div>
              <div className="font-bold text-lg text-center text-foreground">{movie?.title}</div>
              <div className="text-xs text-secondary mb-2 text-center">{movie?.year} &middot; {movie?.segment}</div>
              <div className="text-secondary text-center mb-2">{myReview.review_text}</div>
              <img src={String(movie?.poster || "")} alt={String(movie?.title || "")} className="w-32 h-44 object-cover rounded-xl mx-auto border border-soft" />
              <div className="text-xs text-secondary mt-2">{new Date(myReview.created_at).toLocaleDateString()}</div>
              <div className="absolute top-3 right-3 text-xs text-accent font-bold opacity-60 select-none">CultNode</div>
              <button className="absolute top-3 left-3 text-xs text-red-500 hover:underline" onClick={() => handleDeleteUserReview(myReview.id)}>Delete</button>
              <button
                onClick={() => handleDownloadCard(myReview, movie)}
                className="mt-4 px-6 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white shadow-soft transition"
              >
                Download Card
              </button>
            </div>
          )}
        </div>
        {/* User review form */}
        {userSupabaseId && (
          <form onSubmit={handleSubmitUserReview} className="mt-4">
            <h3 className="text-lg font-bold mb-2 text-accent">Submit Your Review</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                min="1"
                max="10"
                value={userReviewRating || ""}
                onChange={(e) => setUserReviewRating(Number(e.target.value))}
                className="flex-1 rounded-lg bg-card text-foreground p-2 border border-soft focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Rating (1-10)"
                disabled={userReviewSubmitting}
              />
              <input
                type="text"
                value={userReviewText}
                onChange={(e) => setUserReviewText(e.target.value)}
                className="flex-1 rounded-lg bg-card text-foreground p-2 border border-soft focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Review text"
                disabled={userReviewSubmitting}
              />
            </div>
            {userReviewError && <div className="text-red-500 text-sm mb-2">{userReviewError}</div>}
            <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white" disabled={!userReviewText.trim() || !userReviewRating || userReviewSubmitting}>
              {userReviewSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
        {/* Comments section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-accent">Comments</h2>
          <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
            <input
              className="flex-1 rounded-lg bg-card text-foreground p-2 border border-soft focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder={replyTo ? "Reply to comment..." : "Add a comment..."}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              maxLength={500}
            />
            <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white" disabled={!commentText.trim()}>Comment</button>
            {replyTo && <button type="button" className="ml-2 text-xs text-secondary hover:text-red-400" onClick={() => setReplyTo(null)}>Cancel Reply</button>}
          </form>
          <div className="space-y-2">
            {comments.length === 0 && <div className="text-secondary">No comments yet.</div>}
            {renderComments(null, 0, userSupabaseId)}
          </div>
          {!allCommentsLoaded && comments.length > 0 && (
            <button
              className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white w-full"
              onClick={() => setCommentsLimit(l => l + 10)}
            >
              Load More
            </button>
          )}
        </div>
        {/* Forum/Channel link */}
        <div className="mb-2">
          <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-center">
            Channel display will be available soon.
          </div>
        </div>
      </div>
    </>
  );
} 