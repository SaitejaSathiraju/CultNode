"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import UserCard from "../../../components/UserCard";

export default function ReviewDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("reviews");
    const reviews = stored ? JSON.parse(stored) : [];
    setReview(reviews.find((r: any) => r.id === slug));
  }, [slug]);

  if (!review) return <div className="max-w-2xl w-full mx-auto bg-gray-800 rounded-xl p-8 shadow-lg text-center">Review not found.</div>;

  return (
    <div className="max-w-2xl w-full mx-auto bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg">
      <Link href="/reviews" className="text-indigo-400 hover:underline mb-4 inline-block">&larr; Back to Reviews</Link>
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <UserCard avatarUrl={review.avatarUrl} username={review.username || 'Unknown'} />
        <span className="sm:ml-auto text-indigo-400 font-bold">{review.rating}/10</span>
      </div>
      <div className="font-bold text-2xl mb-2">{review.contentTitle}</div>
      <div className="text-xs text-gray-400 mb-4">{review.contentType}</div>
      <div className="text-gray-300 mb-6 whitespace-pre-line">{review.reviewText}</div>
      <div className="text-xs text-gray-500">Posted: {new Date(review.createdAt).toLocaleString()}</div>
    </div>
  );
} 