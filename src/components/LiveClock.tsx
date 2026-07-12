"use client";

import { memo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The VISITOR'S local date + time — auto-detected: no `timeZone` is set, so Intl
// uses the browser's own zone, and `timeZoneName: "short"` prints that zone's
// label (EST / EDT / PDT / BST / GMT+9 …). Formatters built once (module scope);
// in the browser that resolves to the visitor's zone.
const LOCAL_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const LOCAL_TIME = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

function localNow() {
  const now = new Date();
  const t = LOCAL_TIME.formatToParts(now);
  return {
    date: LOCAL_DATE.format(now), // "July 12, 2026"
    hour: t.find((p) => p.type === "hour")?.value ?? "--",
    minute: t.find((p) => p.type === "minute")?.value ?? "--",
    tz: t.find((p) => p.type === "timeZoneName")?.value ?? "",
  };
}

// Blinking colon — ticks the seconds while only HH:MM shows. Module-scope config
// + memo so the parent's per-second updates never restart it; reduced-motion
// holds it steady.
const BLINK = { opacity: [1, 1, 0.15, 0.15, 1] };
const BLINK_T = {
  duration: 1,
  ease: "linear" as const,
  times: [0, 0.48, 0.5, 0.98, 1],
  repeat: Infinity,
};

const BlinkingColon = memo(function BlinkingColon() {
  const reduce = useReducedMotion();
  if (reduce) return <span>:</span>;
  return (
    <motion.span animate={BLINK} transition={BLINK_T}>
      :
    </motion.span>
  );
});

/**
 * The live "Today …" half of the footer's bottom line: the VISITOR'S current local
 * date and time (auto-detected zone, HH:MM 24-hour) with a blinking colon ticking
 * the seconds and the zone's own short label, then a "|" divider before the static
 * "Last Updated …". Renders nothing on the server and until mount (it's the live
 * wall clock in the viewer's zone — unknown at build, and a build value would
 * mismatch on hydration; the reveal footer isn't visible on load, so it's already
 * live by the time the reader scrolls to it). Updates every second.
 */
export function LiveClock() {
  const [now, setNow] = useState<ReturnType<typeof localNow> | null>(null);

  useEffect(() => {
    const tick = () => setNow(localNow());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <span className="tabular-nums">
      Today {now.date}{" "}
      {now.hour}
      <BlinkingColon />
      {now.minute}
      {now.tz ? <span className="text-fg-subtle"> {now.tz}</span> : null}
      <span aria-hidden className="mx-2 text-fg-subtle">
        |
      </span>
    </span>
  );
}
