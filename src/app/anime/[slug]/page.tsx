"use client";
import { use, useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import UserCard from "../../../components/UserCard";
import { supabase } from "../../../utils/supabaseClient";

export default function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useUser();
  const [anime, setAnime] = useState<any>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add a ref for the review card
  const reviewCardRef = useRef<HTMLDivElement>(null);

  // Download review card as image
  const handleDownloadCard = async () => {
    if (!reviewCardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(reviewCardRef.current, { backgroundColor: null });
    const link = document.createElement("a");
    link.download = `review-card-${anime?.slug || "anime"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Fetch anime data
  useEffect(() => {
    async function fetchAnime() {
      const { data, error } = await supabase.from("anime").select("*").eq("slug", slug).single();
      if (error || !data) {
        setAnime(null);
        setLoading(false);
        return;
      }
      setAnime(data);
      setLoading(false);
    }
    fetchAnime();
  }, [slug]);

  // Fetch ratings
  useEffect(() => {
    async function fetchRatings() {
      if (!anime?.id || !user) return;
      // Fetch all ratings for this anime
      const { data: allRatings, error: ratingsError } = await supabase
        .from("ratings")
        .select("user_id, rating")
        .eq("content_type", "anime")
        .eq("content_id", anime.id);
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
  }, [anime?.id, user]);

  // Fix handleVote to use Supabase UUID and error handling
  async function handleVote(rating: number) {
    if (!user || !anime) return;
    // Fetch the user's Supabase UUID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!userRow) {
      alert("Could not find user in Supabase.");
      return;
    }
    const userSupabaseId = userRow.id;
    // Upsert rating
    const { error } = await supabase.from("ratings").upsert([
      {
        user_id: userSupabaseId,
        content_type: "anime",
        content_id: anime.id,
        rating,
      }
    ], { onConflict: "user_id,content_type,content_id" });
    if (error) {
      alert("Failed to submit rating: " + error.message);
      return;
    }
    setUserRating(rating);
    // Refresh ratings
    const { data: allRatings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("content_type", "anime")
      .eq("content_id", anime.id);
    if (allRatings) {
      const ratingsArr = allRatings.map((r: any) => r.rating);
      setRatingsCount(ratingsArr.length);
      setAvgRating(ratingsArr.length ? (ratingsArr.reduce((a: number, b: number) => a + b, 0) / ratingsArr.length).toFixed(1) : null);
    }
  }

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*, users(username, avatar_url)")
        .eq("content_type", "anime")
        .eq("content_id", anime?.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    }
    if (anime?.id) fetchComments();
  }, [anime?.id]);

  // Handle add comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim() || !anime) return;
    (async () => {
      // Fetch the user's UUID from Supabase using their Clerk ID
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (userError || !userRow) {
        alert("Could not find user in Supabase.");
        return;
      }
      const userId = userRow.id;
      const { error } = await supabase.from("comments").insert({
        user_id: userId,
        content_type: "anime",
        content_id: anime.id,
        parent_id: replyTo,
        text: commentText.trim(),
      });
      if (error) {
        alert("Failed to post comment: " + error.message);
        return;
      }
      setCommentText("");
      setReplyTo(null);
      // Refresh comments
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("content_type", "anime")
        .eq("content_id", anime.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    })();
  }

  // Delete comment
  async function handleDeleteComment(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId);
    // Refresh comments
    if (anime?.id) {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("content_type", "anime")
        .eq("content_id", anime.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    }
  }

  // Delete rating
  async function handleDeleteRating() {
    if (!user || !anime) return;
    await supabase.from("ratings").delete().eq("user_id", user.id).eq("content_type", "anime").eq("content_id", anime.id);
    setUserRating(null);
    // Refresh ratings
    if (anime?.id) {
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("content_type", "anime")
        .eq("content_id", anime.id);
      if (data) {
        const ratingsArr = data.map((r: any) => r.rating);
        setRatingsCount(ratingsArr.length);
        setAvgRating(ratingsArr.length ? (ratingsArr.reduce((a: number, b: number) => a + b, 0) / ratingsArr.length).toFixed(1) : null);
      }
    }
  }

  // Fetch reviews for this anime
  const [review, setReview] = useState<any>(null);
  useEffect(() => {
    async function fetchReview() {
      if (!anime?.id) return;
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(username, avatar_url)")
        .eq("content_type", "anime")
        .eq("content_id", anime.id)
        .single(); // Only one review per anime
      if (data) setReview(data);
      else setReview(null);
    }
    fetchReview();
  }, [anime?.id]);

  function renderComments(parentId: string | null = null, level = 0) {
    return comments
      .filter(c => c.parent_id === parentId)
      .map((c, i) => (
        <div key={c.id} className={`flex items-start gap-3 bg-card rounded-lg p-3 mb-2 ml-[${level * 24}px]`} style={{ marginLeft: level ? level * 24 : 0 }}>
          <UserCard avatarUrl={c.users?.avatar_url} username={c.users?.username || 'Unknown'} />
          <div className="flex-1">
            <div className="text-secondary mb-1">{c.text}</div>
            <div className="text-xs text-secondary mb-1">{new Date(c.created_at).toLocaleString()}</div>
            <div className="flex gap-2 items-center">
              <button className="text-xs text-accent hover:underline" onClick={() => setReplyTo(c.id)}>Reply</button>
              {user && c.user_id === user.id && (
                <button className="text-xs text-red-400 hover:underline ml-2" onClick={() => handleDeleteComment(c.id)} title="Delete your comment">Delete</button>
              )}
            </div>
            {renderComments(c.id, level + 1)}
          </div>
        </div>
      ));
  }

  if (loading) return <div className="max-w-3xl w-full mx-auto p-8 text-center text-secondary">Loading...</div>;
  if (!anime) return notFound();

  return (
    <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 bg-card rounded-xl shadow-soft border border-soft">
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        <img src={anime?.poster ?? ''} alt={anime?.title ?? ''} className="w-full sm:w-64 h-80 object-cover rounded-lg border border-soft" />
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold mb-1 text-accent">{anime?.title} {anime?.release_date ? <span className="text-lg text-secondary">({new Date(anime.release_date).getFullYear()})</span> : null}</h1>
          <div className="text-xs text-secondary mb-1">{anime?.segment}</div>
          <div className="text-sm text-secondary">{anime?.description}</div>
          <div className="text-xs text-secondary mt-2">Genres: {anime?.genres?.join(", ")}</div>
        </div>
      </div>
      {/* Trailer section */}
      {anime?.trailer && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-accent">Trailer</h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-soft">
            {anime.trailer.includes('youtube.com') || anime.trailer.includes('youtu.be') ? (
              <iframe
                src={anime.trailer.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title="Anime Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <iframe
                src={anime.trailer}
                title="Anime Trailer"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}
      {/* Poll for rating */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-accent">Rate this Anime</h2>
        <div className="flex items-center gap-2 mb-2">
          {[1,2,3,4,5,6,7,8,9,10].map(r => (
            <button
              key={r}
              className={`w-8 h-8 rounded-full font-bold border-2 ${userRating === r ? "bg-accent text-white border-accent" : "bg-card text-accent border-soft hover:bg-accent hover:text-white"}`}
              onClick={() => handleVote(r)}
              disabled={!user}
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
        {!user && <div className="text-red-400 text-xs mt-2">Sign in to rate this anime.</div>}
      </div>
      {/* Reviews section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-accent">Review</h2>
        {!review && <div className="text-secondary">No review yet.</div>}
        {review && (
          <>
            <div ref={reviewCardRef} className="bg-card rounded-lg p-4 flex flex-col gap-3 items-center max-w-lg mx-auto border border-soft relative">
              <div className="flex items-center gap-3 w-full">
                <UserCard avatarUrl={review.users?.avatar_url} username={review.users?.username || 'Admin'} />
                <span className="ml-auto text-accent font-bold text-xl">{review.rating}/10</span>
              </div>
              <div className="font-bold text-lg text-center text-foreground">{anime?.title}</div>
              <div className="text-xs text-secondary mb-2 text-center">{anime?.year} &middot; {anime?.segment}</div>
              <div className="text-secondary text-center mb-2">{review.review_text}</div>
              <img src={anime?.poster} alt={anime?.title} className="w-32 h-44 object-cover rounded-lg mx-auto border border-soft" />
              <div className="text-xs text-secondary mt-2">{new Date(review.created_at).toLocaleDateString()}</div>
              <div className="absolute top-3 right-3 text-xs text-accent font-bold opacity-60 select-none">CultNode</div>
            </div>
            {user && review.user_id === user.id && (
              <button
                onClick={handleDownloadCard}
                className="mt-4 px-6 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold text-white shadow-soft transition"
              >
                Download Card
              </button>
            )}
          </>
        )}
      </div>
      {/* Comments section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-accent">Comments</h2>
        <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
          <input
            className="flex-1 rounded-lg bg-card text-white p-2 focus:outline-none focus:ring-2 focus:ring-accent-light"
            placeholder={replyTo ? "Reply to comment..." : "Add a comment..."}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            maxLength={500}
            disabled={!user}
          />
          <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold" disabled={!user || !commentText.trim()}>Comment</button>
          {replyTo && <button type="button" className="ml-2 text-xs text-secondary hover:text-red-400" onClick={() => setReplyTo(null)}>Cancel Reply</button>}
        </form>
        <div className="space-y-2">
          {comments.length === 0 && <div className="text-secondary">No comments yet.</div>}
          {renderComments()}
        </div>
      </div>
      {/* Forum/Channel link */}
      <div className="mb-2">
        <Link href={`/channels/${slug}`} className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold">Go to Forum</Link>
      </div>
    </div>
  );
} 