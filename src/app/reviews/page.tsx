"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserCard from "../../components/UserCard";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const filteredReviews = reviews.filter(r => {
    const q = search.toLowerCase();
    return (
      r.contentTitle.toLowerCase().includes(q) ||
      r.contentType.toLowerCase().includes(q) ||
      (r.username || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    // For now, fetch from localStorage (simulate DB)
    const stored = localStorage.getItem("reviews");
    setReviews(stored ? JSON.parse(stored) : []);
  }, []);

  return (
    <div className="max-w-2xl w-full mx-auto bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sm:gap-0">
        <h2 className="text-2xl sm:text-3xl font-bold">Reviews</h2>
        <Link href="/create-review" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold w-full sm:w-auto text-center">Write a Review</Link>
      </div>
      <input
        className="w-full mb-6 p-3 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Search reviews, title, type, user..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="space-y-6">
        {filteredReviews.length === 0 && <div className="text-gray-400">No reviews found.</div>}
        {filteredReviews.map((r) => (
          <Link key={r.id} href={`/reviews/${r.id}`} className="block bg-gray-900 rounded-lg p-4 hover:bg-gray-700 transition">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
              <UserCard avatarUrl={r.avatarUrl} username={r.username || 'Unknown'} />
              <span className="sm:ml-auto text-indigo-400 font-bold">{r.rating}/10</span>
            </div>
            <div className="font-bold text-lg">{r.contentTitle}</div>
            <div className="text-xs text-gray-400">{r.contentType}</div>
            <div className="text-gray-300 mt-2 line-clamp-2">{r.reviewText}</div>
          </Link>
        ))}
      </div>
    </div>
  );
} 