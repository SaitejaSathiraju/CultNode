
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const categories = [
    { id: "all", name: "All Movies" },
    { id: "action", name: "Action" },
    { id: "comedy", name: "Comedy" },
    { id: "drama", name: "Drama" },
    { id: "horror", name: "Horror" },
    { id: "sci-fi", name: "Sci-Fi" },
  ];

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      const { data, error } = await supabase.from("movies").select("*").order("release_date", { ascending: false });
      if (data) setMovies(data);
      setLoading(false);
    }
    fetchMovies();
  }, []);

  const filteredMovies =
    selectedCategory === "all"
      ? movies
      : movies.filter((movie) =>
          (movie.genres || []).includes(selectedCategory)
        );
  const searchedMovies = filteredMovies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search movies..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg bg-white text-gray-800 shadow-sm"
          />
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Movies</h1>
          <p className="text-gray-600">Discover and discuss your favorite films</p>
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

        {/* Movies Grid */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchedMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.slug}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
              >
                <div className="relative">
                  <img
                    src={movie.poster || "https://via.placeholder.com/300x450/1f2937/ffffff?text=No+Image"}
                    alt={movie.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-sm font-medium">
                    {movie.release_date ? new Date(movie.release_date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{movie.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{movie.director}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {(movie.genres || []).join(", ")}
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
            <p className="text-gray-600 mb-4">Sign in to rate movies and join discussions</p>
          </div>
        </SignedOut>
      </div>
    </div>
  );
} 