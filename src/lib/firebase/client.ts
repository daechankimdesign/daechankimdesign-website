"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from "firebase/app-check";

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getClientApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(clientConfig);
}

/** Translation can only be triggered when App Check is configured. */
export function isTranslationConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY);
}

let appCheck: AppCheck | null = null;

function getAppCheckInstance(): AppCheck {
  if (appCheck) return appCheck;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey) throw new Error("App Check site key is not configured");

  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (debugToken) {
    // SDK reads this off the global before initializeAppCheck (local dev only).
    (
      globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  appCheck = initializeAppCheck(getClientApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}

/** Fresh App Check token to attach to the translate Server Action call. */
export async function getAppCheckToken(): Promise<string> {
  const { token } = await getToken(getAppCheckInstance(), false);
  return token;
}
