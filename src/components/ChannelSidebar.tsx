"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export default function ChannelSidebar({ currentChannel }: { currentChannel: string }) {
  const pathname = usePathname();
  const [channels, setChannels] = useState<string[]>([]);
  const [newChannel, setNewChannel] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit("get-channels");
    socket.on("channel-list", (list: string[]) => setChannels(list));
    return () => { socket.disconnect(); };
  }, []);

  function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    const name = newChannel.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (!name || channels.includes(name)) return;
    const socket = io(SOCKET_URL);
    socket.emit("create-channel", name);
    setNewChannel("");
    setTimeout(() => socket.disconnect(), 500); // disconnect after emit
  }

  const filteredChannels = channels.filter(ch => ch.toLowerCase().includes(search.toLowerCase()));

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 h-full flex flex-col py-4">
      <div className="px-6 pb-4 text-lg font-bold text-indigo-400">Channels</div>
      <input
        className="mx-4 mb-3 p-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Search channels..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {filteredChannels.map((ch) => (
          <Link
            key={ch}
            href={`/channels/${ch}`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChannel === ch
                ? "bg-indigo-700 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            #{ch}
          </Link>
        ))}
        {filteredChannels.length === 0 && <div className="text-gray-400 px-4 py-2">No channels found.</div>}
      </nav>
      <form onSubmit={handleCreateChannel} className="px-4 pt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg bg-gray-800 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="New channel"
          value={newChannel}
          onChange={(e) => setNewChannel(e.target.value)}
          maxLength={20}
        />
        <button
          type="submit"
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-sm"
        >
          +
        </button>
      </form>
    </aside>
  );
} 