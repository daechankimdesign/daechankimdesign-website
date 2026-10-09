import { seeded } from "./seeded";

/**
 * Blue painter's tape. Generated rather than a downloaded asset (no licence, no
 * upload, a few hundred bytes): an SVG strip with hand-torn ends, seeded so each
 * piece tears differently but identically on every render, a faint crepe-paper
 * crinkle from fractal noise, a faint sheen, and ~8% translucency. Scales with
 * its paper; recolours with --hw-tape per theme.
 */
export function Tape({ seed }: { seed: number }) {
  const W = 100;
  const H = 30;
  const rnd = seeded(seed * 7919);
  // Fine irregular teeth, with the odd deeper bite where the tear wandered.
  const tornEnd = (x: number, inward: number) => {
    const pts: [number, number][] = [];
    const bite = () => inward * (rnd() < 0.18 ? 2.4 + rnd() * 1.6 : rnd() * 1.6);
    for (let y = 0; y < H; y += 0.9 + rnd() * 1.8) pts.push([x + bite(), y]);
    pts.push([x + bite(), H]);
    return pts;
  };
  const outline = [...tornEnd(W - 1, -1), ...tornEnd(1, 1).reverse()];
  const d = outline.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + "Z";
  const id = `hw-tape-${seed}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
      <defs>
        <filter id={`${id}-crepe`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.36 0.05" numOctaves={2} seed={seed} result="crepe" />
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={seed + 5} result="paper" />
          <feColorMatrix
            in="crepe"
            type="matrix"
            result="shade"
            values="0 0 0 0 0.02  0 0 0 0 0.10  0 0 0 0 0.24  0.2 0 0 0 -0.075"
          />
          <feColorMatrix in="paper" type="matrix" result="mottle" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0.16 0 0 -0.065" />
          <feMerge result="crinkle">
            <feMergeNode in="shade" />
            <feMergeNode in="mottle" />
          </feMerge>
          <feComposite in="crinkle" in2="SourceAlpha" operator="in" result="crinkleIn" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="crinkleIn" />
          </feMerge>
        </filter>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <g opacity="0.92">
        <path d={d} style={{ fill: "var(--hw-tape)" }} filter={`url(#${id}-crepe)`} />
        <path d={d} fill={`url(#${id}-sheen)`} />
      </g>
    </svg>
  );
}

/** The love letter: the owner's envelope graphic (EnvelopeGraphic in
 *  LoveLetter.tsx), with its white swapped for the wall's paper tone so it
 *  matches the polaroids in dark mode. */
export function EnvelopeArt() {
  return (
    <svg viewBox="0 0 84 60" aria-hidden focusable="false">
      <rect x="2" width="80" height="60" rx="4" style={{ fill: "var(--hw-paper)" }} />
      <g filter="url(#hw-env-flap)">
        <path
          d="M45.7516 38.6397C43.5982 40.4534 40.4018 40.4534 38.2484 38.6397L3.99054 9.78624C-0.0203512 6.4081 2.43622 -4.51119e-07 7.74213 0L76.2579 5.82535e-06C81.5638 6.27647e-06 84.0204 6.40812 80.0095 9.78626L45.7516 38.6397Z"
          style={{ fill: "var(--hw-paper)" }}
        />
      </g>
      <defs>
        <filter id="hw-env-flap" x="-4" y="-4" width="92" height="52" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * The resume: a US Letter page (85 × 110 units), a printed name block below the
 * tape line and section rules, folded in thirds and flattened out. The middle
 * panel is the valley, turned slightly from the light, so it reads a shade
 * darker.
 */
export function ResumeArt({ name, role }: { name: string; role: string }) {
  const rnd = seeded(11);
  const rules: { y: number; w: number; label: boolean }[] = [];
  let y = 35;
  for (const n of [4, 3, 3]) {
    rules.push({ y, w: 14 + rnd() * 6, label: true });
    y += 4.2;
    for (let i = 0; i < n; i++) {
      rules.push({ y, w: i === n - 1 ? 30 + rnd() * 20 : 58 + rnd() * 11, label: false });
      y += 3.1;
    }
    y += 3.6;
  }
  return (
    <svg viewBox="0 0 85 110" aria-hidden focusable="false">
      <defs>
        <linearGradient id="hw-fold-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#000" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="hw-fold-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.075" />
          <stop offset="1" stopColor="#000" stopOpacity="0.015" />
        </linearGradient>
        <linearGradient id="hw-fold-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#000" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width="85" height="110" style={{ fill: "var(--hw-paper)" }} />
      <text x="8" y="19" fontSize="6.4" fontWeight="600" fill="#1e1e1e" letterSpacing="-0.15">
        {name}
      </text>
      <text x="8" y="25.4" fontSize="3.4" fill="#6f6f6f">
        {role}
      </text>
      <rect x="8" y="29" width="69" height="0.35" fill="#d0d0d0" />
      {rules.map((r, i) => (
        <rect
          key={i}
          x="8"
          y={r.y.toFixed(1)}
          width={r.w.toFixed(1)}
          height={r.label ? 1.5 : 1.1}
          rx="0.3"
          fill={r.label ? "#6f6f6f" : "#c4c4c4"}
        />
      ))}
      <rect width="85" height="36.67" fill="url(#hw-fold-a)" />
      <rect y="36.67" width="85" height="36.66" fill="url(#hw-fold-b)" />
      <rect y="73.33" width="85" height="36.67" fill="url(#hw-fold-c)" />
      <rect y="36.42" width="85" height="0.35" fill="#000" fillOpacity="0.12" />
      <rect y="36.77" width="85" height="0.4" fill="#fff" fillOpacity="0.7" />
      <rect y="73.08" width="85" height="0.35" fill="#000" fillOpacity="0.12" />
      <rect y="73.43" width="85" height="0.4" fill="#fff" fillOpacity="0.7" />
    </svg>
  );
}
