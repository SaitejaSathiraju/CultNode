"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function CreateReviewPage() {
  const { user } = useUser();
  const router = useRouter();
  const [contentType, setContentType] = useState("Movie");
  const [contentTitle, setContentTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!contentTitle.trim() || !reviewText.trim()) {
      setError("Title and review text are required.");
      return;
    }
    if (!user) {
      setError("You must be signed in to write a review.");
      return;
    }
    const newReview = {
      id: Math.random().toString(36).slice(2),
      userId: user.id,
      username: user.username || 'Unknown',
      avatarUrl: user.imageUrl,
      contentType,
      contentTitle: contentTitle.trim(),
      rating,
      reviewText: reviewText.trim(),
      createdAt: new Date().toISOString(),
    };
    const stored = localStorage.getItem("reviews");
    const reviews = stored ? JSON.parse(stored) : [];
    reviews.unshift(newReview);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    router.push("/reviews");
  }

  return (
    <div className="max-w-2xl w-full mx-auto bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4">Write a Review</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={contentType} onChange={e => setContentType(e.target.value)} className="rounded-lg bg-gray-900 text-white p-2 w-full sm:w-auto">
            <option>Movie</option>
            <option>Anime</option>
            <option>Game</option>
            <option>Show</option>
            <option>Book</option>
          </select>
          <input
            className="flex-1 rounded-lg bg-gray-900 text-white p-2"
            placeholder="Title (e.g. Spirited Away)"
            value={contentTitle}
            onChange={e => setContentTitle(e.target.value)}
            maxLength={60}
          />
          <input
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="w-full sm:w-20 rounded-lg bg-gray-900 text-white p-2"
            placeholder="Rating"
          />
        </div>
        <textarea
          className="rounded-lg bg-gray-900 text-white p-2 min-h-[120px]"
          placeholder="Write your review..."
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          maxLength={2000}
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold">Submit Review</button>
      </form>
    </div>
  );
} 