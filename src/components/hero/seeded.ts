/** Deterministic PRNG (mulberry32). Same seed → same sequence, on the server and
 *  in the browser, so seeded artwork never causes a hydration mismatch. */
export function seeded(start: number) {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
