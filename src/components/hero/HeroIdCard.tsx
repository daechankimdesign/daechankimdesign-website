"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import type { CardLabels, LanyardAPI } from "./lanyard";

/**
 * The hero's 3D ID card on a lanyard. Renders only a canvas that spans the hero
 * section (its nearest positioned ancestor); the scene itself (lanyard.ts, and
 * three.js with it) is a dynamic import, fetched after the hero has painted, so
 * the hero's text and wall never wait for it. It drops in when `dropped` turns
 * true (the hero's sub-text beat) and is held back above the page when it turns
 * false again (the hero replays on re-entry).
 *
 * Framed off `wall` (HeroWall's element). A click flicks it, then goes to
 * About. Without WebGL a flat card stands in, where the 3D one would hang.
 */
export function HeroIdCard({
  wall,
  dropped,
  photo,
  labels,
}: {
  wall: HTMLDivElement | null;
  dropped: boolean;
  /** Same-origin card photo, 1x and 2x (WebGL must be able to read it). */
  photo: { sq320: string; sq480: string };
  labels: CardLabels;
}) {
  const reduce = !!useReducedMotion();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<LanyardAPI | null>(null);
  const droppedRef = useRef(dropped);
  const routerRef = useRef(router);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    droppedRef.current = dropped;
    if (dropped) api.current?.release();
    else api.current?.reset();
  }, [dropped]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wall) return;
    let alive = true;
    let instance: LanyardAPI | null = null;
    // The printed text uses the site's own Noto Sans (next/font's family name).
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-noto-sans").trim() || "system-ui, sans-serif";
    // The card's photo is ~36% of the card's width: 320px covers 1x screens,
    // 480px covers 2x and up.
    const src = (window.devicePixelRatio || 1) > 1.5 ? photo.sq480 : photo.sq320;
    import("./lanyard")
      .then(({ createLanyard }) =>
        createLanyard({
          canvas,
          wall,
          reduce,
          photo: src,
          labels,
          family,
          onActivate: () => routerRef.current.push("/about"),
        }),
      )
      .then((created) => {
        if (!alive) {
          created.destroy();
          return;
        }
        instance = created;
        api.current = created;
        if (droppedRef.current) created.release();
      })
      .catch((err) => {
        console.warn("ID card: WebGL unavailable, showing the flat card.", err);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      instance?.destroy();
      api.current = null;
    };
    // labels/photo are static per page; rebuilding the scene for them is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wall, reduce]);

  return (
    <>
      <canvas ref={canvasRef} className="hw-card-canvas" aria-hidden hidden={failed} />
      {failed && wall
        ? createPortal(
            <div className="hw-card-fallback" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.sq320} alt="" />
              <b>{labels.name}</b>
              <span>{labels.role}</span>
            </div>,
            wall,
          )
        : null}
    </>
  );
}
