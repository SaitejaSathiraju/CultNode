"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { supabase } from "@/utils/supabaseClient";

export default function ProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState({ movies: 0, games: 0, anime: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "activity", name: "Activity" },
    { id: "preferences", name: "Preferences" },
  ];

  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;
      setLoading(true);
      // Fetch Supabase user UUID by Clerk ID
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (!userRow) return setLoading(false);
      const userId = userRow.id;
      // Fetch ratings count for each type
      const [{ count: movies }, { count: games }, { count: anime }] = await Promise.all([
        supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("content_type", "movie"),
        supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("content_type", "game"),
        supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("content_type", "anime"),
      ]);
      setOverview({ movies: movies || 0, games: games || 0, anime: anime || 0 });
      // Fetch only the signed-in user's own ratings (reviews) and comments
      const { data: ratings } = await supabase
        .from("ratings")
        .select("*, movies(title), games(title), anime(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      const { data: comments } = await supabase
        .from("comments")
        .select("*, movies(title), games(title), anime(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      // Merge and sort by date
      const merged = [
        ...(ratings || []).map(r => ({
          type: "rating",
          title: r.movies?.title || r.games?.title || r.anime?.title || "",
          rating: r.rating,
          date: r.created_at,
        })),
        ...(comments || []).map(c => ({
          type: "comment",
          title: c.movies?.title || c.games?.title || c.anime?.title || "",
          text: c.text,
          date: c.created_at,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(merged);
      setLoading(false);
    }
    fetchProfileData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SignedIn>
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600">{user?.emailAddresses[0]?.emailAddress}</p>
                <p className="text-sm text-gray-500">Member since {user?.createdAt?.toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Overview</h2>
                  {loading ? (
                    <div className="text-gray-500">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Movies Rated</h3>
                        <p className="text-2xl font-bold text-orange-500">{overview.movies}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Games Rated</h3>
                        <p className="text-2xl font-bold text-orange-500">{overview.games}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Anime Rated</h3>
                        <p className="text-2xl font-bold text-orange-500">{overview.anime}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  {loading ? (
                    <div className="text-gray-500">Loading...</div>
                  ) : activity.length === 0 ? (
                    <div className="text-gray-500">No recent activity.</div>
                  ) : (
                    <div className="space-y-4">
                      {activity.map((a, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {a.type === "rating" ? (
                                <>
                                  Rated <span className="font-bold">{a.title}</span>
                                </>
                              ) : (
                                <>
                                  Commented on <span className="font-bold">{a.title}</span>
                                </>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</p>
                          </div>
                          {a.rating && (
                            <span className="text-sm font-medium text-orange-500">{a.rating}/10</span>
                          )}
                          {a.text && (
                            <span className="text-xs text-gray-700 italic">{a.text}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "preferences" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Notifications
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Receive email notifications</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Privacy
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Make profile public</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your profile</h2>
            <p className="text-gray-600">Create an account to track your activity and preferences</p>
          </div>
        </SignedOut>
      </div>
    </div>
  );
} 