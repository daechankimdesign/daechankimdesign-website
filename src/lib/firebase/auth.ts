"use client";

import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getClientApp } from "./client";

const clientAuth = (): Auth => getAuth(getClientApp());

/**
 * Ensure a stable anonymous identity (used by the per-user rate limiter) and
 * return a fresh ID token for the Server Action to verify server-side.
 */
export async function ensureAnonymousIdToken(): Promise<string> {
  const auth = clientAuth();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const user = auth.currentUser;
  if (!user) throw new Error("Anonymous sign-in failed");
  return user.getIdToken();
}
