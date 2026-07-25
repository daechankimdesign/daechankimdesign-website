/**
 * Password-gated projects — a SOFT gate (deterrent only).
 *
 * ⚠️ NOT real security. With this "approach A" gate the full article is still
 * rendered and sent to the browser; a determined visitor can read it by disabling
 * JavaScript, viewing source, or deleting the blur in devtools. It stops casual
 * peeking, nothing more. For true protection the content must be withheld
 * server-side until a password is verified (a larger change — ask if needed).
 *
 * Keyed by slug → SHA-256 hex of the password (so no plaintext sits in the repo,
 * though the hash still ships to the client). To set or change a password:
 *
 *     printf '%s' 'your-new-password' | shasum -a 256
 *
 * then paste the hex below. The seeded value unlocks with:  emerald
 */
export const PROTECTED_HASHES: Record<string, string> = {
  "interactive-maps-for-local-residents-to-learn-and-discover-the-parks":
    "c26e57ce338c5af38f838e36fc6a398368b4dcd4fdc69993634345f602552a75",
};

/** The gate hash for a slug, or null if the project isn't password-protected. */
export function getProtectedHash(slug: string): string | null {
  return PROTECTED_HASHES[slug] ?? null;
}
