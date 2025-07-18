"use client";
import { useSupabaseUserSync } from "../hooks/useSupabaseUserSync";

export default function SupabaseUserSyncClient() {
  useSupabaseUserSync();
  return null;
} 