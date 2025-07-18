import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-orange-600 dark:text-orange-400 mb-6">
            CultNode
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Global Channel System for Real-Time Communication
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <Link 
                href="/channels"
                className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-lg"
              >
                Enter Channels
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-lg">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-orange-500 text-3xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Messaging</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Instant messaging with live updates powered by Supabase Realtime
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-orange-500 text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Global Access</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Connect with users worldwide through public and private channels
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-orange-500 text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enterprise-grade security with Row Level Security and authentication
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Sign Up</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Create your account with secure authentication
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Join Channels</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Browse and join public channels or create your own
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Start Chatting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Send messages in real-time with other users
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Stay Connected</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                See who's online and stay updated with live notifications
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
            Ready to Connect?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users in real-time conversations
          </p>
          <SignedIn>
            <Link 
              href="/channels"
              className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-lg inline-block"
            >
              Enter Channels Now
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-lg">
                Start Chatting
              </button>
            </SignInButton>
          </SignedOut>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Supabase, and Clerk</p>
          <p className="mt-2">Production-ready global channel system</p>
        </footer>
      </div>
    </div>
  );
}
