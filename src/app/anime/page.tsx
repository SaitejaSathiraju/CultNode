"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function AnimePage() {
  const [anime, setAnime] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const categories = [
    { id: "all", name: "All Anime" },
    { id: "action", name: "Action" },
    { id: "comedy", name: "Comedy" },
    { id: "drama", name: "Drama" },
    { id: "fantasy", name: "Fantasy" },
    { id: "romance", name: "Romance" },
  ];

  useEffect(() => {
    async function fetchAnime() {
      setLoading(true);
      const { data, error } = await supabase.from("anime").select("*").order("release_date", { ascending: false });
      if (data) setAnime(data);
      setLoading(false);
    }
    fetchAnime();
  }, []);

  const filteredAnime =
    selectedCategory === "all"
      ? anime
      : anime.filter((a) =>
          (a.genres || []).includes(selectedCategory)
        );
  const searchedAnime = filteredAnime.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search anime..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg bg-white text-gray-800 shadow-sm"
          />
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anime</h1>
          <p className="text-gray-600">Discover and discuss your favorite anime</p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Anime Grid */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchedAnime.map((a) => (
              <Link
                key={a.id}
                href={`/anime/${a.slug}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
              >
                <div className="relative">
                  <img
                    src={a.poster || "https://via.placeholder.com/300x200/1f2937/ffffff?text=No+Image"}
                    alt={a.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-sm font-medium">
                    {a.release_date ? new Date(a.release_date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{a.segment}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {(a.genres || []).join(", ")}
                    </span>
                    <SignedIn>
                      <span className="text-orange-500 text-xs font-medium">Rate</span>
                    </SignedIn>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Sign In Prompt */}
        <SignedOut>
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Sign in to rate anime and join discussions</p>
          </div>
        </SignedOut>
      </div>
    </div>
  );
} 