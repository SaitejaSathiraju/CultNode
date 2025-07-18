"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

export function useSupabaseUserSync() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      // Generate a valid username: prefer Clerk username, then email prefix, then fallback to user_<clerkId>
      let baseUsername =
        user.username ||
        (user.emailAddresses?.[0]?.emailAddress
          ? user.emailAddresses[0].emailAddress.split("@")[0]
          : null) ||
        `user_${user.id.slice(0, 8)}`;
      // Remove invalid chars and ensure length/format
      let safeUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
      if (safeUsername.length < 3) {
        safeUsername = `user_${user.id.slice(0, 8)}`;
      }

      const { error } = await supabase.from("users").upsert(
        [
          {
            clerk_id: user.id,
            username: safeUsername,
            avatar_url: user.imageUrl,
          },
        ],
        { onConflict: "clerk_id" }
      );

      if (error) {
        console.error("Supabase user sync error:", error.message, error.details || error);
      } else {
        console.log("Supabase user synced:", { clerk_id: user.id, username: safeUsername });
      }
    };

    syncUser();
  }, [user]);
}
