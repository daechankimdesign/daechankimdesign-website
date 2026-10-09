"use client";

import "./hero-wall.css";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { HeroGallery, type HeroStackItem } from "../HeroGallery";
import { useLoveLetter } from "../LoveLetter";
import { useResume } from "../ResumeModal";
import { EnvelopeArt, ResumeArt, Tape } from "./art";
import { createWall, type WallController } from "./wall";

/** A photo on the wall: its lightbox entry plus the small square crops the
 *  polaroid shows (1x / 2x) and its handwritten caption. */
export type WallPhoto = HeroStackItem & { sq160: string; sq320: string; label: string };

/**
 * The hero's imaginary wall: three taped polaroids (each opens the lightbox),
 * the love letter's envelope and a folded resume (each opens the same sheet as
 * its hero CTA), and handwriting on the wall pointing at the two. Positions are
 * shuffled on every visit and the items tape in on the hero's reveal beats
 * (`step`, from HeroHeadline). All motion lives in wall.ts.
 *
 * The 3D ID card is NOT in here: it hangs in front of the wall from a canvas
 * that spans the whole hero (HeroIdCard), and reads this element's geometry.
 */
export function HeroWall({
  photos,
  portrait,
  step,
  notes,
  card,
  hovered = null,
  onWallElement,
}: {
  photos: WallPhoto[];
  /** The ID card's photo, as the lightbox's last slide (keeps its credit reachable). */
  portrait: HeroStackItem;
  step: number;
  /** Wall handwriting beside the envelope and the resume ("\n" breaks a line). */
  notes: { letter: string; resume: string };
  /** The name block printed on the resume. */
  card: { name: string; role: string };
  /** A hero CTA being hovered: its wall counterpart lifts as if pointed at. */
  hovered?: "letter" | "resume" | null;
  onWallElement?: (el: HTMLDivElement | null) => void;
}) {
  const reduce = !!useReducedMotion();
  const loveLetter = useLoveLetter();
  const resumeModal = useResume();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controller = useRef<WallController | null>(null);
  const stepRef = useRef(step);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const gallery = [...photos, portrait];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const wall = createWall(root, { reduce });
    controller.current = wall;
    wall.setStep(stepRef.current);
    return () => {
      wall.destroy();
      controller.current = null;
    };
  }, [reduce]);

  useEffect(() => {
    if (!hovered) return;
    const wall = controller.current;
    wall?.setHover(hovered, true);
    return () => wall?.setHover(hovered, false);
  }, [hovered]);

  useEffect(() => {
    stepRef.current = step;
    controller.current?.setStep(step);
  }, [step]);

  return (
    <>
      <div
        ref={(el) => {
          rootRef.current = el;
          onWallElement?.(el);
        }}
        className="hw-wall"
      >
        {/* Written on the wall first, so the taped paper sits over it. */}
        <div className="hw-notes" aria-hidden>
          <svg data-arrows>
            <path data-arrow="letter" pathLength={1} />
            <path data-arrow-head="letter" pathLength={1} />
            <path data-arrow="resume" pathLength={1} />
            <path data-arrow-head="resume" pathLength={1} />
          </svg>
          <span className="hw-note" data-note="letter" style={{ "--nr": -3 } as CSSProperties}>
            {notes.letter}
          </span>
          <span className="hw-note" data-note="resume" style={{ "--nr": -4 } as CSSProperties}>
            {notes.resume}
          </span>
        </div>

        {photos.map((p, i) => (
          <button
            key={p.full}
            type="button"
            data-item
            data-kind="photo"
            className="hw-item hw-polaroid"
            aria-label={`Open photo: ${p.headline.replace(/[“”]/g, "")}`}
            onClick={() => setOpenIndex(i)}
            // Warm the lightbox's full image on intent, so it is usually ready by the click.
            onPointerEnter={() => {
              new Image().src = p.full;
            }}
          >
            <span className="hw-tilt">
              <span className="hw-lift" />
              <span className="hw-paper">
                <span className="hw-photo">
                  {/* Plain <img>: App Hosting serves no optimizer, so the small
                      square crops ARE the responsive set. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.sq320}
                    srcSet={`${p.sq160} 160w, ${p.sq320} 320w`}
                    sizes="(min-width: 1024px) 200px, 150px"
                    width={320}
                    height={320}
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                    draggable={false}
                  />
                </span>
                <span className="hw-cap" aria-hidden>
                  {p.label}
                </span>
              </span>
              <span className="hw-tape">
                <Tape seed={i + 3} />
              </span>
            </span>
          </button>
        ))}

        <button
          type="button"
          data-item
          data-kind="letter"
          className="hw-item hw-envelope"
          aria-label="Open the love letter to design"
          onClick={() => loveLetter?.open()}
        >
          <span className="hw-tilt">
            <span className="hw-lift" />
            <span className="hw-art">
              <EnvelopeArt />
            </span>
            <span className="hw-tape">
              <Tape seed={6} />
            </span>
          </span>
        </button>

        <button
          type="button"
          data-item
          data-kind="resume"
          className="hw-item hw-resume"
          aria-label="Open the resume"
          onClick={() => resumeModal?.open("wall")}
        >
          <span className="hw-tilt">
            <span className="hw-lift" />
            <span className="hw-art">
              <ResumeArt name={card.name} role={card.role} />
            </span>
            <span className="hw-tape">
              <Tape seed={7} />
            </span>
          </span>
        </button>
      </div>

      <HeroGallery
        items={gallery}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
