/**
 * The hero wall's behaviour, driven imperatively on the DOM HeroWall renders:
 * the per-visit arrangement, the taping sequence, the handwriting on the wall
 * and its arrows, and the hover tilt + tape peel. Kept out of React state on
 * purpose: everything here is per-frame / per-pointer-move work, and it writes
 * only data-* attributes and inline custom properties, which React never
 * touches (see hero-wall.css).
 */

type Kind = "photo" | "letter" | "resume";
type Slot = "s1" | "s2" | "s3" | "s4" | "s5";
type Box = { left: number; top: number; right: number; bottom: number };
type Spring = { x: number; v: number; to: number };

const SLOTS: Slot[] = ["s1", "s2", "s3", "s4", "s5"];
const EASE_PRESS = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const EASE_TAPE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const HELD_SHADOW = "0 0 0 0.5px rgb(0 0 0 / 0.05), 10px 30px 40px -12px rgb(var(--hw-ink) / var(--hw-sh-b))";
const HELD_FILTER =
  "drop-shadow(0 0 0 transparent) drop-shadow(6px 18px 14px rgb(var(--hw-ink) / var(--hw-sh-b))) drop-shadow(10px 30px 24px rgb(var(--hw-ink) / var(--hw-sh-a)))";
// Hover tilt: TiltedCard's behaviour (exaggerated amplitude), same spring.
const TILT = { amplitude: 26, scale: 1.2, stiffness: 100, damping: 30, mass: 2 };

const area = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const box = (left: number, top: number, w: number, h: number): Box => ({ left, top, right: left + w, bottom: top + h });

export type WallController = {
  /** The hero's reveal counter (HeroHeadline): 0 resets, 1–3 tape the photos,
   *  5 tapes the envelope and the resume. */
  setStep: (step: number) => void;
  /** Lift an item as if hovered: the hero CTAs point at their wall counterparts. */
  setHover: (kind: "letter" | "resume", hovered: boolean) => void;
  destroy: () => void;
};

export function createWall(root: HTMLElement, { reduce }: { reduce: boolean }): WallController {
  const hero = root.closest("section") ?? root;
  const items = [...root.querySelectorAll<HTMLElement>("[data-item]")];
  const kindOf = (el: HTMLElement) => el.dataset.kind as Kind;
  const photos = items.filter((el) => kindOf(el) === "photo");
  const letter = items.find((el) => kindOf(el) === "letter");
  const resume = items.find((el) => kindOf(el) === "resume");
  const slotOf = (el: HTMLElement) => el.dataset.slot as Slot | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const cleanups: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  // ── Arrangement: a fresh shuffle of the five slots on every visit ──────────
  // Tilts are dealt from spread-out bands (gentle to steep), so each
  // arrangement mixes near-straight and strongly angled items, and the side
  // papers fan OUTWARD: each turns about its top centre, so a left paper turns
  // clockwise and a right one anticlockwise, swinging its bottom (and caption)
  // away from the card and the centre paper rather than under them.
  const arrange = () => {
    const slots = [...SLOTS];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const bands = [3, 5.5, 8, 10.5, 13].sort(() => Math.random() - 0.5);
    const lean: Record<Slot, number> = { s1: 1, s3: 1, s2: -1, s4: -1, s5: Math.random() < 0.5 ? -1 : 1 };
    const jitter = (amount: number) => `${((Math.random() * 2 - 1) * amount).toFixed(2)}%`;
    items.forEach((el, i) => {
      el.dataset.slot = slots[i];
      el.style.setProperty("--r", (lean[slots[i]] * (bands[i] + (Math.random() * 1.6 - 0.8))).toFixed(1));
      el.style.setProperty("--tr", ((Math.random() * 2 - 1) * 11).toFixed(1));
      el.style.setProperty("--jx", jitter(1.5));
      el.style.setProperty("--jy", jitter(1.5));
    });
  };

  // ── Handwriting on the wall ────────────────────────────────────────────────
  const arrows = root.querySelector<SVGSVGElement>("[data-arrows]");
  const notes = new Map<HTMLElement, { label: HTMLElement; line: SVGPathElement; head: SVGPathElement }>();
  for (const [item, key] of [
    [letter, "letter"],
    [resume, "resume"],
  ] as const) {
    const label = root.querySelector<HTMLElement>(`[data-note="${key}"]`);
    const line = root.querySelector<SVGPathElement>(`[data-arrow="${key}"]`);
    const head = root.querySelector<SVGPathElement>(`[data-arrow-head="${key}"]`);
    if (item && label && line && head) notes.set(item, { label, line, head });
  }

  // An item's real footprint on the wall after its tilt (it turns about its top
  // centre, transform-origin 50% 4%), so a note clears the paper and the arrow
  // lands on the paper's actual edge. offset* ignore transforms, so this works
  // whether or not the item is pinned yet.
  const geometry = (item: HTMLElement) => {
    const x = item.offsetLeft;
    const y = item.offsetTop;
    const w = item.offsetWidth;
    const h = item.offsetHeight;
    const r = ((parseFloat(item.style.getPropertyValue("--r")) || 0) * Math.PI) / 180;
    const ox = x + w / 2;
    const oy = y + h * 0.04;
    const at = (lx: number, ly: number): [number, number] => {
      const dx = x + lx - ox;
      const dy = y + ly - oy;
      return [ox + dx * Math.cos(r) - dy * Math.sin(r), oy + dx * Math.sin(r) + dy * Math.cos(r)];
    };
    const corners = [at(0, 0), at(w, 0), at(0, h), at(w, h)];
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    return { at, x, w, h, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  };

  // Writes each note on open wall beside its paper: above it for the top row
  // (open wall under the nav), below it for the bottom row, preferring the
  // paper's OUTER side, away from the card. Each note tries a few spots (outer
  // side, other side, centred; nudged clear of a neighbour) and takes the
  // nearest one that touches no paper, no card, no other note, and stays clear
  // of the nav and the headline. The arrow leaves the note's end that faces its
  // paper, stands off both ends, and hooks into the paper's edge.
  const layoutNotes = () => {
    if (!arrows) return;
    const W = root.clientWidth;
    const H = root.clientHeight;
    arrows.setAttribute("width", String(W));
    arrows.setAttribute("height", String(H));
    const desktop = matchMedia("(min-width: 1024px)").matches;
    const cs = getComputedStyle(root);
    const cardH = W * parseFloat(cs.getPropertyValue("--card-h"));
    const cardW = (cardH * 1.6) / 2.25;
    const cardBottom = H * parseFloat(cs.getPropertyValue("--card-top")) + cardH;
    // The card, plus the strap column above it.
    const blockers: (Box & { owner?: HTMLElement })[] = [
      { left: (W - cardW) / 2, right: (W + cardW) / 2, top: -1e4, bottom: cardBottom },
    ];
    items.forEach((it) => blockers.push({ ...geometry(it), owner: it }));
    const minY = 72 - root.offsetTop; // clear of the nav pill
    const maxY = desktop ? H + 80 : H + 8; // desktop: into the hero's bottom padding; mobile: above the headline
    const placed: Box[] = [];

    notes.forEach(({ label, line, head }, item) => {
      const slot = slotOf(item);
      if (!slot) return;
      const g = geometry(item);
      const F = parseFloat(getComputedStyle(label).fontSize);
      const lw = label.offsetWidth;
      const lh = label.offsetHeight;
      const above = slot === "s1" || slot === "s2";
      const gap = 1.42 * F;
      const baseY = above ? g.top - gap - lh : g.bottom + gap;
      const mid = (g.left + g.right) / 2;
      const left = slot === "s1" || slot === "s3";
      const outerX = left ? g.left + 0.04 * g.w : g.right - lw - 0.04 * g.w;
      const innerX = left ? g.right - lw - 0.04 * g.w : g.left + 0.04 * g.w;
      const xs = slot === "s5" ? [mid + 0.06 * g.w, mid - 0.06 * g.w - lw, mid - lw / 2] : [outerX, innerX, mid - lw / 2];
      const others: Box[] = [...blockers.filter((b) => b.owner !== item), ...placed];
      const hits = (r: Box) => others.reduce((sum, b) => sum + area(r, b), 0);

      let best: { r: Box; score: number } | null = null;
      for (const x0 of xs) {
        let r = box(Math.max(2, Math.min(x0, W + 40 - lw)), baseY, lw, lh);
        // Something in the way: step further from the paper until clear.
        for (let step = 0; step < 3 && hits(r) > 0; step++) {
          const inWay = others.filter((b) => area(r, b) > 0);
          const y = above
            ? Math.min(...inWay.map((b) => b.top)) - 0.5 * gap - lh
            : Math.max(...inWay.map((b) => b.bottom)) + 0.5 * gap;
          r = box(r.left, y, lw, lh);
        }
        const outside = r.top < minY || r.bottom > maxY;
        const score = hits(r) * 100 + (outside ? 1e7 : 0) + Math.abs(r.top - baseY) + Math.abs(r.left - x0) * 0.2;
        if (!best || score < best.score) best = { r, score };
        if (score === 0) break;
      }
      if (!best) return;
      const { r } = best;
      placed.push(r);
      label.style.left = `${r.left}px`;
      label.style.top = `${r.top}px`;
      const inward = mid >= r.left + lw / 2 ? 1 : -1; // the note's end facing its paper
      label.style.textAlign = inward > 0 ? "right" : "left";

      const sx = inward > 0 ? r.right + 0.6 * F : r.left - 0.6 * F;
      const sy = r.top + lh * (above ? 0.72 : 0.28);
      const localX = Math.max(0.2 * g.w, Math.min(0.8 * g.w, sx + inward * 1.0 * F - g.x));
      const [tx, ty] = g.at(localX, above ? -0.6 * F : g.h + 0.6 * F);
      const cx = sx + 0.85 * (tx - sx);
      const cy = sy + 0.15 * (ty - sy);
      line.setAttribute("d", `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`);
      // Arrowhead: two short strokes back along the curve's final direction.
      const ul = Math.hypot(tx - cx, ty - cy) || 1;
      const ux = (tx - cx) / ul;
      const uy = (ty - cy) / ul;
      const hl = 0.42 * F;
      const spread = 0.5;
      const wing = (s: number) => [
        tx - hl * (ux * Math.cos(spread) - s * uy * Math.sin(spread)),
        ty - hl * (uy * Math.cos(spread) + s * ux * Math.sin(spread)),
      ];
      const [w1, w2] = [wing(1), wing(-1)];
      head.setAttribute(
        "d",
        `M${w1[0].toFixed(1)} ${w1[1].toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${w2[0].toFixed(1)} ${w2[1].toFixed(1)}`,
      );
      // About as heavy as the pen strokes in the handwriting itself.
      const stroke = Math.max(1.4, 0.075 * F).toFixed(2);
      line.setAttribute("stroke-width", stroke);
      head.setAttribute("stroke-width", stroke);
    });
  };

  // The note appears with its paper; then the arrow draws itself in, shaft
  // first, then the head.
  const showNote = (item: HTMLElement, instant = false) => {
    const n = notes.get(item);
    if (!n) return;
    n.label.dataset.on = "";
    if (instant) {
      n.line.style.strokeDashoffset = "0";
      n.head.style.strokeDashoffset = "0";
      return;
    }
    n.line.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, delay: 180, easing: "cubic-bezier(0.3, 0.6, 0.3, 1)", fill: "forwards" });
    n.head.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 170, delay: 690, easing: "ease-out", fill: "forwards" });
  };
  const hideNote = (item: HTMLElement) => {
    const n = notes.get(item);
    if (!n) return;
    delete n.label.dataset.on;
    [n.line, n.head].forEach((p) => {
      p.getAnimations().forEach((a) => a.cancel());
      p.style.strokeDashoffset = "1";
    });
  };

  // ── Taping: pressed onto the wall, then the tape is laid across the top ────
  const tilts = new Map<HTMLElement, { layer: HTMLElement; rx: Spring; ry: Spring; s: Spring; live: boolean; peeled: boolean }>();
  const pinned = new Set<HTMLElement>();
  const pin = (el: HTMLElement) => {
    if (pinned.has(el)) return;
    pinned.add(el);
    if (reduce) {
      el.dataset.pinned = "";
      showNote(el, true);
      return;
    }
    const cs = getComputedStyle(el);
    const r = parseFloat(cs.getPropertyValue("--r")) || 0;
    const tr = parseFloat(cs.getPropertyValue("--tr")) || 0;
    const surface = el.querySelector<HTMLElement>(".hw-paper, .hw-art");
    const tape = el.querySelector<HTMLElement>(".hw-tape");
    const lift = el.querySelector<HTMLElement>(".hw-lift");
    const body = el.animate(
      [
        { opacity: 0, transform: `translate(8px, -26px) rotate(${r + 7}deg) scale(1.14)` },
        { opacity: 1, transform: `translate(0, 2px) rotate(${r - 0.6}deg) scale(0.986)`, offset: 0.62 },
        { transform: `translate(0, 0) rotate(${r + 0.25}deg) scale(1.003)`, offset: 0.84 },
        { opacity: 1, transform: `rotate(${r}deg)` },
      ],
      { duration: 540, easing: EASE_PRESS, fill: "both" },
    );
    if (surface?.classList.contains("hw-paper")) {
      surface.animate([{ boxShadow: HELD_SHADOW }, { boxShadow: getComputedStyle(surface).boxShadow }], { duration: 380, easing: "ease-out", fill: "backwards" });
    } else if (surface) {
      surface.animate([{ filter: HELD_FILTER }, { filter: getComputedStyle(surface).filter }], { duration: 380, easing: "ease-out", fill: "backwards" });
    }
    lift?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 420, fill: "backwards" });
    const base = `translate(-50%, -46%) rotate(${tr}deg)`;
    tape?.animate(
      [
        { opacity: 0, transform: `${base} translateY(-5px) scale(1.06)`, clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, transform: `${base} scale(1.01)`, clipPath: "inset(0 30% 0 0)", offset: 0.45 },
        { opacity: 1, transform: base, clipPath: "inset(0 0 0 0)" },
      ],
      { duration: 300, delay: 300, easing: EASE_TAPE, fill: "both" },
    );
    body.finished.then(
      () => {
        if (!pinned.has(el)) return;
        el.dataset.pinned = "";
        el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        showNote(el);
      },
      () => {},
    );
  };
  const unpin = (el: HTMLElement) => {
    pinned.delete(el);
    el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    delete el.dataset.pinned;
    hideNote(el);
    const t = tilts.get(el);
    if (t) {
      t.rx.x = t.rx.to = t.ry.x = t.ry.to = t.rx.v = t.ry.v = t.s.v = 0;
      t.s.x = t.s.to = 1;
      t.live = false;
      t.peeled = false;
      t.layer.style.transform = "";
      delete el.dataset.lifted;
    }
  };

  // Lines 1–3 each tape a photo; the CTAs (step 5) arrive with their wall
  // counterparts, the envelope and then the resume.
  let step = 0;
  const setStep = (next: number) => {
    if (next <= 0) {
      timers.forEach(clearTimeout);
      timers.clear();
      items.forEach(unpin);
    } else {
      photos.slice(0, Math.min(next, photos.length)).forEach(pin);
      if (next >= 5) {
        if (letter) pin(letter);
        if (resume) {
          if (reduce || step >= 5) pin(resume);
          else later(() => pin(resume), 200);
        }
      }
    }
    step = next;
  };

  // ── Hover: TiltedCard's tilt on every paper (not the ID card) ─────────────
  // The pointer is mapped into the paper's own axes, since every paper is
  // already rotated on the wall. Mouse only, as in TiltedCard; off under
  // reduced motion. Pointing at the ID card where it covers a paper does not
  // tilt it. While hovered the tape peels off; leaving lays it back down.
  let raf = 0;
  let last = 0;
  const stepSpring = (p: Spring, h: number) => {
    p.v += ((-TILT.stiffness * (p.x - p.to) - TILT.damping * p.v) / TILT.mass) * h;
    p.x += p.v * h;
  };
  const settled = (p: Spring, eps: number) => Math.abs(p.x - p.to) < eps && Math.abs(p.v) < eps;
  const frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
    last = now;
    let running = false;
    tilts.forEach((t, el) => {
      if (!t.live) return;
      for (let i = 0; i < 4; i++) [t.rx, t.ry, t.s].forEach((p) => stepSpring(p, dt / 4));
      const atRest = t.s.to === 1 && t.rx.to === 0 && t.ry.to === 0;
      if (atRest && settled(t.rx, 0.01) && settled(t.ry, 0.01) && settled(t.s, 0.0005)) {
        t.live = false;
        t.layer.style.transform = "";
        delete el.dataset.lifted;
        return;
      }
      running = true;
      t.layer.style.transform = `rotateX(${t.rx.x.toFixed(3)}deg) rotateY(${t.ry.x.toFixed(3)}deg) scale(${t.s.x.toFixed(4)})`;
    });
    raf = running ? requestAnimationFrame(frame) : 0;
  };
  const wake = (t: { live: boolean }) => {
    t.live = true;
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const overCard = () => hero.hasAttribute("data-card");
  const tapeBase = (el: HTMLElement) => `translate(-50%, -46%) rotate(${parseFloat(el.style.getPropertyValue("--tr")) || 0}deg)`;

  // Per-item hover steps, shared by the pointer and by setHover() (the hero CTA).
  const hovers = new Map<HTMLElement, { enter: () => void; leave: () => void }>();

  items.forEach((el) => {
    const layer = el.querySelector<HTMLElement>(".hw-tilt");
    const tape = el.querySelector<HTMLElement>(".hw-tape");
    if (!layer) return;
    const t = { layer, rx: { x: 0, v: 0, to: 0 }, ry: { x: 0, v: 0, to: 0 }, s: { x: 1, v: 0, to: 1 }, live: false, peeled: false };
    tilts.set(el, t);
    const usable = (e: PointerEvent) => !reduce && e.pointerType === "mouse" && el.hasAttribute("data-pinned");
    const rest = () => {
      if (t.s.to === 1) return;
      t.rx.to = 0;
      t.ry.to = 0;
      t.s.to = 1;
      wake(t);
    };
    const follow = (e: PointerEvent) => {
      if (!usable(e)) return;
      if (overCard()) return rest();
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const r = (-(parseFloat(el.style.getPropertyValue("--r")) || 0) * Math.PI) / 180;
      const lx = dx * Math.cos(r) - dy * Math.sin(r);
      const ly = dx * Math.sin(r) + dy * Math.cos(r);
      t.rx.to = (ly / (el.offsetHeight / 2)) * -TILT.amplitude;
      t.ry.to = (lx / (el.offsetWidth / 2)) * TILT.amplitude;
      t.s.to = TILT.scale;
      el.dataset.lifted = "";
      wake(t);
    };
    const peel = () => {
      if (t.peeled || !tape) return;
      t.peeled = true;
      const b = tapeBase(el);
      tape.getAnimations().forEach((a) => a.cancel());
      tape.animate(
        [
          { transform: b, clipPath: "inset(0 0 0 0)", opacity: 1 },
          { transform: `${b} translateY(-7px) rotate(6deg) scale(1.05)`, clipPath: "inset(0 0 0 55%)", opacity: 1, offset: 0.6 },
          { transform: `${b} translateY(-12px) rotate(9deg) scale(1.06)`, clipPath: "inset(0 0 0 100%)", opacity: 0 },
        ],
        { duration: 200, easing: "ease-in", fill: "forwards" },
      );
    };
    const relay = () => {
      if (!t.peeled || !tape) return;
      t.peeled = false;
      const b = tapeBase(el);
      tape.getAnimations().forEach((a) => a.cancel());
      tape.animate(
        [
          { transform: `${b} translateY(-5px) scale(1.06)`, clipPath: "inset(0 100% 0 0)", opacity: 0 },
          { transform: `${b} scale(1.01)`, clipPath: "inset(0 30% 0 0)", opacity: 1, offset: 0.45 },
          { transform: b, clipPath: "inset(0 0 0 0)", opacity: 1 },
        ],
        { duration: 650, delay: 250, easing: EASE_TAPE, fill: "backwards" },
      );
    };
    on(el, "pointerenter", (e) => {
      if (usable(e)) peel();
    });
    on(el, "pointerenter", follow);
    on(el, "pointermove", follow);
    on(el, "pointerleave", () => {
      rest();
      relay();
    });
    // Hovered from elsewhere (the hero CTA): lift as if pointed at the lower
    // outer corner, a gentle fixed tilt, with the same peel.
    hovers.set(el, {
      enter: () => {
        if (reduce || !el.hasAttribute("data-pinned")) return;
        peel();
        const outer = el.dataset.slot === "s1" || el.dataset.slot === "s3" ? -1 : 1;
        t.rx.to = -0.35 * TILT.amplitude;
        t.ry.to = outer * 0.4 * TILT.amplitude;
        t.s.to = TILT.scale;
        el.dataset.lifted = "";
        wake(t);
      },
      leave: () => {
        rest();
        relay();
      },
    });
  });

  arrange();
  layoutNotes();
  const ro = new ResizeObserver(layoutNotes);
  ro.observe(root);
  // Note widths change once the handwriting font arrives.
  document.fonts.addEventListener("loadingdone", layoutNotes);

  return {
    setStep,
    setHover: (kind, hovered) => {
      const el = kind === "letter" ? letter : resume;
      const h = el && hovers.get(el);
      if (h) (hovered ? h.enter : h.leave)();
    },
    destroy: () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.fonts.removeEventListener("loadingdone", layoutNotes);
      cleanups.forEach((fn) => fn());
      items.forEach((el) => el.getAnimations({ subtree: true }).forEach((a) => a.cancel()));
    },
  };
}
