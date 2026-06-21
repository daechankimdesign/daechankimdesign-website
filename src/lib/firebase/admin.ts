import {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getAppCheck, type AppCheck } from "firebase-admin/app-check";

/**
 * Server-only Firebase Admin singleton. On App Hosting / Cloud Run the runtime
 * provides Application Default Credentials automatically (no key file); for
 * local dev, GOOGLE_APPLICATION_CREDENTIALS points to a service-account JSON.
 * The app is initialized lazily on first use, so English (disk-only) pages
 * never touch Firebase.
 */
function adminApp(): App {
  return getApps().length
    ? getApp()
    : initializeApp({ credential: applicationDefault() });
}

export const adminDb = (): Firestore => getFirestore(adminApp());
export const adminAuth = (): Auth => getAuth(adminApp());
export const adminAppCheck = (): AppCheck => getAppCheck(adminApp());
