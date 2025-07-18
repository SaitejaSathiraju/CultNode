"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="backdrop-blur-md bg-white/80 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-semibold text-gray-900 tracking-tight">🎮 CultNode 🎥</span>
          </Link>

          {/* Hamburger */}
          <button
            className="md:hidden flex items-center text-2xl text-gray-900 focus:outline-none"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open navigation menu"
          >
            ☰
          </button>

          {/* Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: "🎥 Movies", href: "/movies" },
              { name: "🎮 Games", href: "/games" },
              { name: "🌀 Anime", href: "/anime" },
              { name: "🎤 Channels", href: "/channels" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-all px-2 py-1 rounded-md ${
                  isActive(item.href)
                    ? "text-black border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            <SignedIn>
              <Link
                href="/profile"
                className={`text-sm font-medium transition-all px-2 py-1 rounded-md ${
                  isActive("/profile")
                    ? "text-black border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                Profile
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-800 border border-gray-300 rounded-md px-4 py-1.5 hover:border-gray-900 transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/80 backdrop-blur-md border-t border-gray-200 py-4 space-y-3 animate-fade-in">
            {[
              { name: "🎥 Movies", href: "/movies" },
              { name: "🎮 Games", href: "/games" },
              { name: "🌀 Anime", href: "/anime" },
              { name: "🎤 Channels", href: "/channels" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-medium px-3 py-2 rounded-md transition-all ${
                  isActive(item.href)
                    ? "text-black bg-gray-100"
                    : "text-gray-600 hover:text-black hover:bg-gray-50"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <SignedIn>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-medium px-3 py-2 rounded-md transition-all ${
                  isActive("/profile")
                    ? "text-black bg-gray-100"
                    : "text-gray-600 hover:text-black hover:bg-gray-50"
                }`}
              >
                Profile
              </Link>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full text-base font-medium text-gray-800 border border-gray-300 rounded-md px-4 py-2 hover:border-gray-900 transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        )}
      </div>
    </nav>
  );
}
