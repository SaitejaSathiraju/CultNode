import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CultNode - Biggest fandom community platform",
  description: "A modern community platform for movies, games, anime, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>CultNode - Biggest fandom community platform</title>
          <meta name="description" content="A modern community platform for movies, games, anime, and more" />
        </head>
        <body className={inter.className}>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
