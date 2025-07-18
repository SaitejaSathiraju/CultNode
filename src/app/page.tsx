"use client"

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="container mx-auto px-6 py-20 max-w-7xl">

        {/* HERO */}
        <header className="text-center mb-32">
          <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 tracking-tight">
          🎮 CultNode 🎥
          </h1>
          <p className="text-2xl md:text-3xl text-gray-500 max-w-2xl mx-auto mt-6">
          🫵 Your World.
          💢 Your Fandom. 1️⃣One Platform to Unite Them All.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <Link href="/profile" className="px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-900">
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900">
                💢 Join CultNode
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {/* TRENDING FANDOMS */}
        <section className="mb-32 max-w-7xl mx-auto px-6">
  <h2 className="text-4xl font-semibold text-center mb-20 text-gray-900">📈Trending Now</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
    {[
      { name: "Stranger Things", tag: "Dive into the mysteries beyond.", buzz: "The upside down is calling.", doodle: "🌀" },
      { name: "Marvel", tag: "Heroes and stories that inspire.", buzz: "Assemble your squad.", doodle: "🦸‍♂️" },
      { name: "K-Pop", tag: "Global beats, unforgettable moves.", buzz: "Dance like nobody's watching.", doodle: "🎤" },
      { name: "Star Wars", tag: "A galaxy of stories awaits.", buzz: "Feel the Force awaken.", doodle: "🌌" },
      { name: "Anime", tag: "Timeless tales, endless worlds.", buzz: "Your next binge starts here.", doodle: "🎎" },
      { name: "Bollywood", tag: "Vibrant stories from India’s heart.", buzz: "Feel the rhythm and drama.", doodle: "💃" },
      { name: "Tollywood", tag: "South Indian cinema’s pride.", buzz: "Power-packed storytelling.", doodle: "🎬" },
      { name: "Harry Potter", tag: "Magic that never fades.", buzz: "Wands ready, spells loaded.", doodle: "🪄" },
      { name: "Premier League", tag: "Passion on every pitch.", buzz: "Goals, glory, and gossip.", doodle: "⚽" },
      { name: "Taylor Swift", tag: "Songs that tell your story.", buzz: "Shake it off and sing along.", doodle: "🎸" },
      { name: "BTS", tag: "Breaking records, building dreams.", buzz: "Worldwide handsome vibes.", doodle: "🎶" },
      { name: "One Piece", tag: "Adventure on the high seas.", buzz: "Set sail for epic tales.", doodle: "🏴‍☠️" },
      { name: "Nollywood", tag: "Africa’s cinematic heartbeat.", buzz: "Stories with soul.", doodle: "🎥" },
      { name: "Gaming", tag: "Play, compete, connect.", buzz: "Ready, set, game on!", doodle: "🎮" },
      { name: "Formula 1", tag: "Speed meets precision.", buzz: "Fast cars, fierce rivalries.", doodle: "🏎️" },
      { name: "K-Drama", tag: "Stories that move you.", buzz: "Grab the tissues.", doodle: "📺" },
      { name: "Blackpink", tag: "Unstoppable girl power.", buzz: "Born to slay.", doodle: "🎤" },
      { name: "AI Art", tag: "Creativity meets technology.", buzz: "Future’s masterpiece.", doodle: "🤖" },
      { name: "Metaverse", tag: "Step into new digital worlds.", buzz: "Where reality blurs.", doodle: "🕶️" }
    ].map(({ name, tag, buzz, doodle }) => (
      <div
        key={name}
        className="text-center border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <span>{doodle}</span> {name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{tag}</p>
        <p className="text-gray-400 text-xs italic">{buzz}</p>
      </div>
    ))}
  </div>
</section>

<section className="bg-white py-24 px-6 text-center border-t border-gray-200">
  <div className="max-w-7xl mx-auto space-y-20">

    {/* Heading */}
    <div>
      <h2 className="text-5xl font-extrabold text-gray-900">Global. Limitless. United by Fandom.</h2>
      <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
        CultNode brings together every fan, from every continent, in every language — for every passion.
      </p>
    </div>

    {/* Main Grid (Continents & Languages) */}
    <div className="grid md:grid-cols-2 gap-12 text-left">

      {/* Continents */}
      <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">🌍 Worldwide Reach</h3>
        <ul className="text-gray-600 space-y-2 text-base list-disc list-inside">
          <li>Asia</li>
          <li>Europe</li>
          <li>North America</li>
          <li>South America</li>
          <li>Africa</li>
          <li>Australia & Oceania</li>
          <li className="italic text-sm text-gray-400 ml-5">Even Antarctica has fans here.</li>
        </ul>
      </div>

      {/* Languages */}
      <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">🌐 50+ Languages</h3>
        <p className="text-gray-600 mb-4 text-base">Our users share content in:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 max-h-60 overflow-y-auto pr-2">
          {[
            'English', 'Hindi', 'Spanish', 'Mandarin', 'Japanese', 'Korean', 'Arabic', 'French', 'Portuguese',
            'German', 'Russian', 'Tamil', 'Telugu', 'Bengali', 'Turkish', 'Urdu', 'Vietnamese', 'Swahili',
            'Hebrew', 'Italian', 'Thai', 'Polish', 'Dutch', 'Malayalam', 'Gujarati', 'Kannada', 'Greek', 'Czech',
            'Serbian', 'Romanian', 'Ukrainian', 'Amharic', 'Hungarian', 'Pashto', 'Tagalog', 'Sinhala', 'Burmese',
            'Indonesian', 'Khmer', 'Finnish', 'Swedish', 'Danish', 'Norwegian', 'Zulu', 'Nepali', 'Farsi',
          ].map((lang, i) => (
            <span key={i} className="block">{lang}</span>
          ))}
        </div>
      </div>
    </div>

    {/* Fandoms Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">

      {/* Gaming */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">🎮 Gaming</h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          PS5, PS4, Xbox Series X|S, Xbox One, Nintendo Switch, PC, Steam, Mobile (iOS/Android),
          Cloud Gaming, VR, Retro Consoles (SNES, PS2, GBA, Dreamcast), Emulators, Arcades.
        </p>
      </div>

      {/* Movies */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">🎬 Movies</h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          Hollywood, Bollywood, Tollywood, Anime Films, Independent Cinema, Documentaries,
          World Cinema, Short Films, Festival Features, Fan Edits.
        </p>
      </div>

      {/* Anime */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">🌀 Anime</h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          Shonen, Seinen, Shojo, Isekai, Slice of Life, BL/GL, Mecha, Sports, Psychological, Fantasy,
          Horror, Historical, Magical Girl, OVA, Web Anime, Donghua.
        </p>
      </div>

      {/* TV/Series */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <h4 className="text-xl font-semibold text-gray-800 mb-3">📺 TV & Series</h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          Netflix Originals, K-Dramas, J-Dramas, Web Series, Limited Series, Reality Shows, Talk Shows,
          Classic TV, Streaming Exclusives, Miniseries, Sci-Fi Series, Crime, Anthologies.
        </p>
      </div>

    </div>
  </div>
</section>








        {/* FEATURES */}
        <section className="mb-32 text-center">
  <h2 className="text-4xl font-bold mb-12">Everything You Need in Cult Node</h2>
  <p className="mb-8 text-lg text-gray-600 max-w-3xl mx-auto">
    Join one of the biggest fandom communities on the globe — Cult Node — where passion meets connection, and the fun never stops!
  </p>
  <div className="grid md:grid-cols-3 gap-10">
    {[
      { icon: "💬", title: "Live Chat", desc: "Realtime updates using Supabase Realtime." },
      { icon: "🌍", title: "Global Fandoms", desc: "Connect across countries & cultures." },
      { icon: "🔐", title: "Secure Access", desc: "Clerk-powered authentication + RLS." },
      { icon: "⚔️", title: "Fan Wars", desc: "Engage in friendly competitions between fandoms and show your loyalty." },
      { icon: "🗯️", title: "Trash Talks", desc: "Playfully roast rival fandoms and defend your favorites." },
      { icon: "🏆", title: "Leaderboards & Rewards", desc: "Earn points, badges, and exclusive perks for your fandom." }
    ].map((item, i) => (
      <div key={i} className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition">
        <div className="text-5xl mb-4">{item.icon}</div>
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="text-gray-500 mt-2">{item.desc}</p>
      </div>
    ))}
  </div>
</section>


        {/* Doodle Break */}
        <div className="flex justify-center mb-32">
          <img src="/doodles/fans-doodle.svg" alt="Fan doodle" className="w-48 opacity-70" />
        </div>

        {/* CTA */}
        <section className="text-center mb-20">
          <h2 className="text-3xl font-bold mb-6">Join the Movement</h2>
          <p className="text-gray-600 mb-8">Stay in the loop and celebrate your fandom in real-time.</p>
          <SignedIn>
            <Link href="/channels" className="px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-900">
              Go to Channels
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-900">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
        </section>

        {/* FOOTER */}
        <footer className="bg-white text-gray-600 py-16 px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo and About */}
        <div>
          <h3 className="text-3xl font-semibold text-gray-900 mb-4">Cult Node</h3>
          <p className="text-gray-500">
            One of the biggest fandom communities on the globe. Unite, battle, and celebrate your passion with fans worldwide.
          </p>
          <p className="mt-6 text-sm text-gray-400">© {new Date().getFullYear()} Cult Node. All rights reserved.</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-900">Quick Links</h4>
          <ul className="space-y-2">
            <li><a href="#live-chat" className="hover:text-gray-900 transition">Live Chat</a></li>
            <li><a href="#global-fandoms" className="hover:text-gray-900 transition">Global Fandoms</a></li>
            <li><a href="#fan-wars" className="hover:text-gray-900 transition">Fan Wars</a></li>
            <li><a href="#trash-talks" className="hover:text-gray-900 transition">Trash Talks</a></li>
            <li><a href="#leaderboards" className="hover:text-gray-900 transition">Leaderboards</a></li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-900">Community</h4>
          <ul className="space-y-2">
            <li><a href="/forums" className="hover:text-gray-900 transition">Forums</a></li>
            <li><a href="/events" className="hover:text-gray-900 transition">Events</a></li>
            <li><a href="/support" className="hover:text-gray-900 transition">Support</a></li>
            <li><a href="/blog" className="hover:text-gray-900 transition">Blog</a></li>
          </ul>
        </div>

        {/* Social & Newsletter */}
        <div>
          <h4 className="text-xl font-semibold mb-4 text-gray-900">Stay Connected</h4>
          <div className="flex space-x-6 mb-6">
            {/* X (Twitter) */}
            <a href="https://twitter.com/cultnode" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" >
                <path d="M23 3a10.9 10.9 0 0 1-3.14.86 4.48 4.48 0 0 0 1.96-2.48 9.05 9.05 0 0 1-2.88 1.1 4.52 4.52 0 0 0-7.72 4.13A12.84 12.84 0 0 1 1.64 2.16 4.48 4.48 0 0 0 3 9.58a4.48 4.48 0 0 1-2.05-.57v.06a4.52 4.52 0 0 0 3.63 4.43 4.48 4.48 0 0 1-2.04.08 4.52 4.52 0 0 0 4.21 3.13A9.06 9.06 0 0 1 1 19.54a12.77 12.77 0 0 0 6.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.01-.58A9.22 9.22 0 0 0 23 3z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com/company/cultnode" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8a2.5 2.5 0 0 1-.02-4.5zM3 9h4v12H3zM9 9h3.6v1.71h.05a3.96 3.96 0 0 1 3.56-1.95c3.81 0 4.51 2.5 4.51 5.74V21H16v-5.28c0-1.26-.02-2.89-1.76-2.89-1.76 0-2.03 1.37-2.03 2.78V21H9z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com/cultnode" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm5 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
            </a>
          </div>

          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks for subscribing!");
            }}
          >
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </footer>
      </div>
    </div>
  );
}
