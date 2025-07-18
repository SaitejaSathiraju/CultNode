"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-orange-500">CultNode</span>
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="md:hidden flex items-center text-3xl text-orange-500 focus:outline-none"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open navigation menu"
          >
            &#9776;
          </button>

          {/* Navigation Links (desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/movies" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/movies') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Movies
            </Link>
            <Link 
              href="/games" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/games') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>
            <Link 
              href="/anime" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/anime') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Anime
            </Link>
            <Link 
              href="/channels" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/channels') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Channels
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <SignedIn>
              {/* Add Profile link back for signed-in users */}
              <Link 
                href="/profile" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
                onClick={() => setMobileMenuOpen(false)}
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
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-sm rounded-b-xl px-4 py-4 space-y-2 animate-fade-in">
            <Link 
              href="/movies" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/movies') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Movies
            </Link>
            <Link 
              href="/games" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/games') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>
            <Link 
              href="/anime" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/anime') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Anime
            </Link>
            <Link 
              href="/channels" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/channels') 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Channels
            </Link>
            <SignedIn>
              {/* Add Profile link to mobile menu */}
              <Link 
                href="/profile" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium mt-2">
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