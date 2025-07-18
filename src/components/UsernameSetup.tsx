"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function UsernameSetup() {
  const { user, isLoaded } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return null;
  if (user?.username) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    const uname = username.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!uname || uname.length < 3) {
      setError("Username must be at least 3 characters and only contain letters, numbers, - or _");
      setLoading(false);
      return;
    }
    if (user?.username === uname) {
      setError("This is already your username.");
      setLoading(false);
      return;
    }
    try {
      await user?.update({ username: uname });
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      if (err.errors && err.errors[0]?.message) {
        setError(err.errors[0].message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Username is taken, invalid, or there was a network error.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl shadow-xl flex flex-col gap-4 w-96">
        <h2 className="text-2xl font-bold text-indigo-400 mb-2">Choose a Username</h2>
        <input
          className="rounded-lg bg-gray-800 text-white p-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter a unique username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          maxLength={20}
          disabled={loading}
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">Username set! Reloading...</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg mt-2"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Username"}
        </button>
      </form>
    </div>
  );
} 