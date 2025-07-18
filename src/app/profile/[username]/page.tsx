import { currentUser } from "@clerk/nextjs/server";
import UserCard from "../../../components/UserCard";
import React from "react";

export default async function ProfilePage({ params }: { params: { username: string } }): Promise<React.ReactElement> {
  const { username } = params;
  // Fetch user by username (for demo, use currentUser)
  // In production, use Clerk API to fetch by username
  const user = await currentUser();
  // Placeholder: in real app, fetch by params.username
  if (!user) return <div className="text-center py-12">User not found.</div>;
  return (
    <div className="max-w-2xl w-full mx-auto bg-card rounded-xl p-8 shadow-soft border border-soft">
      <div className="flex flex-col items-center gap-4 mb-8">
        <UserCard avatarUrl={user.imageUrl} username={user.username || "(no username)"} />
        <div className="text-secondary">@{user.username}</div>
      </div>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 text-accent">Bio</h3>
        <div className="bg-card rounded-lg p-4 text-secondary border border-soft">(User bio coming soon)</div>
      </div>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 text-accent">Recent Reviews</h3>
        <div className="bg-card rounded-lg p-4 text-secondary border border-soft">(Reviews coming soon)</div>
      </div>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2 text-accent">Joined Channels</h3>
        <div className="bg-card rounded-lg p-4 text-secondary border border-soft">(Joined channels coming soon)</div>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 text-accent">Badges</h3>
        <div className="bg-card rounded-lg p-4 text-secondary border border-soft">(Badges coming soon)</div>
      </div>
    </div>
  );
} 