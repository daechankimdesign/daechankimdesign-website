'use client'

// CoverFlow — Apple-style 3D cover-flow carousel.
// Adapted from https://ashishgogula.in/r/coverflow.json (shadcn registry).
// Changes vs. source: imports rewired from `motion/react` to the project's
// `framer-motion`; React-namespace type replaced; a conditional useReducedMotion
// call hoisted to satisfy rules-of-hooks. Audio + reflection are opt-in (off).

/* eslint-disable @next/next/no-img-element, react-hooks/refs, react-hooks/set-state-in-effect --
   Vendored third-party component. The fallback <img> renderer (unused here — we
   pass next/image via renderImage), the ref-mirror sync during render, and the
   client-only detection via setState-in-effect are inherent to the upstream
   design and safe. Scoped to this file only. */

import { memo, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type PanInfo,
  type MotionValue,
} from 'framer-motion'

type Direction = 'left' | 'right'

const AudioCtx: typeof AudioContext | null =
  typeof window !== 'undefined'
    ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null)
    : null

function useTickAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => () => { ctxRef.current?.close().catch(() => {}); ctxRef.current = null }, [])

  useEffect(() => {
    if (!enabled || !AudioCtx) return
    const warm = () => {
      if (!ctxRef.current) ctxRef.current = new AudioCtx!()
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [enabled])

  return useCallback(
    (direction: Direction, velocity = 1) => {
      if (!enabled || !AudioCtx) return

      const getCtx = async () => {
        if (!ctxRef.current) ctxRef.current = new AudioCtx!()
        if (ctxRef.current.state === 'suspended') await ctxRef.current.resume()
        return ctxRef.current
      }

      getCtx().then((ctx) => {
        const t = ctx.currentTime
        const vn = Math.min(Math.abs(velocity) / 300, 1)
        const peakGain = 0.28 * (0.55 + vn * 0.45)
        const freq = 1600 * (0.88 + vn * 0.24)
        const bodyDur = 0.022 - vn * 0.008
        const clickDur = bodyDur * 0.3
        const panStart = direction === 'left' ? 0.7 : -0.7
        const panEnd = direction === 'left' ? -0.7 : 0.7

        const panner = ctx.createStereoPanner()
        panner.pan.setValueAtTime(panStart, t)
        panner.pan.linearRampToValueAtTime(panEnd, t + bodyDur)
        panner.connect(ctx.destination)

        const bodyGain = ctx.createGain()
        bodyGain.gain.setValueAtTime(peakGain, t)
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + bodyDur)
        bodyGain.connect(panner)

        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = freq
        filter.Q.value = 6
        filter.connect(bodyGain)

        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq * 1.25, t)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + bodyDur)
        osc.connect(filter)
        osc.start(t)
        osc.stop(t + bodyDur)

        const nSamples = Math.ceil(ctx.sampleRate * clickDur)
        const noiseBuf = ctx.createBuffer(1, nSamples, ctx.sampleRate)
        const d = noiseBuf.getChannelData(0)
        for (let i = 0; i < nSamples; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nSamples * 0.2))

        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(peakGain * 0.35, t)
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + clickDur)
        noiseGain.connect(panner)

        const noiseHp = ctx.createBiquadFilter()
        noiseHp.type = 'highpass'
        noiseHp.frequency.value = 2400
        noiseHp.connect(noiseGain)

        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuf
        noise.connect(noiseHp)
        noise.start(t)
        noise.stop(t + clickDur)
      }).catch(() => {})
    },
    [enabled],
  )
}

export interface CoverFlowItem {
  id: string | number
  image: string
  title: string
  subtitle?: string
}

export interface RenderImageProps {
  src: string
  alt: string
  width: number
  height: number
  className: string
  draggable: boolean
  sizes: string
  priority?: boolean
  loading?: 'eager' | 'lazy'
}

export interface CoverFlowProps {
  items: CoverFlowItem[]
  itemWidth?: number
  itemHeight?: number
  stackSpacing?: number
  centerGap?: number
  rotation?: number
  initialIndex?: number
  enableReflection?: boolean
  enableClickToSnap?: boolean
  enableScroll?: boolean
  enableAudio?: boolean
  /**
   * Axis the deck flips along. `vertical` drives the cards along Y with rotateX
   * and reads vertical wheel / drag / ↑↓ keys, releasing the wheel at the deck's
   * ends so the page keeps scrolling. `horizontal` (default) is the classic
   * cover flow used by the sandbox.
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * External fractional position driver — e.g. page-scroll progress mapped to
   * [0, items.length - 1]. When provided the deck is CONTROLLED by this value:
   * its own wheel and drag are disabled so the page's own scroll drives the
   * cards (no separate, hover-captured scroll). The centred card is derived by
   * rounding this value.
   */
  positionValue?: MotionValue<number>
  /** Built-in centered title/subtitle overlay. Set false to render your own. */
  showCaption?: boolean
  /**
   * Opacity of the flat white veil drawn over every OFF-centre card (0 = none,
   * 1 = fully hidden). Higher fades the side cards further toward the canvas. A
   * flat veil, never a gradient. Default 0.5.
   */
  sideVeilOpacity?: number
  /**
   * Hovering the deck fans its cards apart by this multiplier (1 = off), sprung
   * so it eases open/closed. Default 1.
   */
  hoverExpand?: number
  /**
   * Px a card lifts (translateY up) while the pointer is over it, animated.
   * Horizontal decks only. 0 = off. Default 0.
   */
  hoverLiftPx?: number
  /**
   * While the deck is hovered, fade the OFF-centre veil to 0 so the side cards
   * show in full (sprung, and back on leave). Needs `sideVeilOpacity` > 0 to have
   * anything to reveal. Default false.
   */
  hoverRevealSides?: boolean
  /**
   * Rising edge (false → true) snaps the deck's spring onto its current position
   * so it materializes there (e.g. an "unfocused" pre-roll where no card is
   * centered) instead of gliding in from a stale value. Wire to whatever makes the
   * deck visible.
   */
  appear?: boolean
  /**
   * On the appear rising edge, pre-roll the spring this many slots PAST the target
   * (to the right) so the deck sweeps IN from the side straight into focus — one
   * continuous motion, no separate slide or unfocused hold. 0 = materialize in
   * place. Default 0.
   */
  entranceOffset?: number
  /**
   * Hover a card to slide it to center (after a short delay). Guarded so the
   * layout shift it causes never re-triggers itself — only a fresh mouse move
   * arms the next slide.
   */
  enableHoverSlide?: boolean
  scrollThreshold?: number
  reduceMotion?: boolean
  className?: string
  onItemClick?: (item: CoverFlowItem, index: number) => void
  onIndexChange?: (index: number) => void
  renderImage?: (props: RenderImageProps) => ReactNode
}

const defaultRenderImage = (props: RenderImageProps) => (
  <img
    src={props.src}
    alt={props.alt}
    width={props.width}
    height={props.height}
    className={props.className}
    draggable={props.draggable}
    sizes={props.sizes}
    loading={props.loading}
  />
)

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0))
}

export function CoverFlow({
  items,
  itemWidth = 400,
  itemHeight = 400,
  stackSpacing = 100,
  centerGap = 250,
  rotation = 50,
  initialIndex = 0,
  enableReflection = false,
  enableClickToSnap = true,
  enableScroll = true,
  enableAudio = false,
  orientation = 'horizontal',
  positionValue,
  showCaption = true,
  sideVeilOpacity = 0.5,
  hoverExpand = 1,
  hoverLiftPx = 0,
  hoverRevealSides = false,
  appear = false,
  entranceOffset = 0,
  enableHoverSlide = false,
  scrollThreshold = 100,
  reduceMotion,
  className,
  onItemClick,
  onIndexChange,
  renderImage,
}: CoverFlowProps) {
  const safeInitial = clampIndex(initialIndex, items.length)
  const [activeIndex, setActiveIndex] = useState(safeInitial)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceId = useId().replace(/:/g, 'x')
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const apply = () => setIsMobile(mql.matches)
    apply()
    mql.addEventListener?.('change', apply)
    return () => mql.removeEventListener?.('change', apply)
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsSafari(/^((?!chrome|android).)*safari/i.test(window.navigator.userAgent))
  }, [])
  const scale = containerWidth > 0 && itemWidth > 0 ? Math.min(1, (containerWidth * 0.78) / itemWidth) : 1
  const effectiveWidth = Math.round(itemWidth * scale)
  const effectiveHeight = Math.round(itemHeight * scale)
  const effectiveStackSpacing = Math.round(stackSpacing * scale)
  const effectiveCenterGap = Math.round(centerGap * scale)

  const reflectionFilterId = (isMounted && enableReflection && !isMobile && !isSafari) ? `${instanceId}-rf` : undefined
  const showReflection = isMounted && enableReflection
  const activeIndexRef = useRef(activeIndex)
  const enableScrollRef = useRef(enableScroll)
  const scrollThresholdRef = useRef(scrollThreshold)
  const onItemClickRef = useRef(onItemClick)
  const enableClickToSnapRef = useRef(enableClickToSnap)
  const onIndexChangeRef = useRef(onIndexChange)
  const isMountedForCallbackRef = useRef(false)
  const enableHoverSlideRef = useRef(enableHoverSlide)
  // Hover-to-slide is driven by each card's own mousemove — a REAL pointer move.
  // A card sliding under a STATIONARY cursor fires mouseenter but never
  // mousemove, so it can't re-trigger itself: the loop is impossible by
  // construction (no arm/disarm bookkeeping needed). `hoverTimer` is the 0.5s
  // settle delay; the last card the pointer rests on wins.
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  activeIndexRef.current = activeIndex
  enableScrollRef.current = enableScroll
  scrollThresholdRef.current = scrollThreshold
  onItemClickRef.current = onItemClick
  enableClickToSnapRef.current = enableClickToSnap
  onIndexChangeRef.current = onIndexChange
  enableHoverSlideRef.current = enableHoverSlide

  const systemReducedMotion = useReducedMotion()
  const prefersReducedMotion = reduceMotion ?? systemReducedMotion
  const scrollX = useMotionValue(safeInitial)
  // Near-critical (no wobble) but softened to a ~0.45s settle, so each intro focus
  // shift GLIDES across most of its 600ms text beat instead of snapping in ~0.33s
  // and then sitting frozen ~0.27s — that freeze read as a "hard stop." Lower the
  // stiffness for even less freeze (softer manual snapping is the trade). Also
  // governs the entrance sweep and manual drag/scroll snapping.
  const springX = useSpring(scrollX, { stiffness: 90, damping: 18, mass: 1 })
  // Hover-to-expand: the container's mouse-enter/leave drives `spreadTarget`
  // between `hoverExpand` and 1; `spread` springs to it and each card multiplies
  // its offset by it, fanning the deck open. 1 (default) is a no-op.
  const spreadTarget = useMotionValue(1)
  const spread = useSpring(spreadTarget, { stiffness: 200, damping: 26 })
  // Hover-to-reveal: the same mouse-enter/leave fades the side veil to 0 (and back
  // to `sideVeilOpacity`), so hovering the deck un-fades the off-centre cards.
  const veilTarget = useMotionValue(sideVeilOpacity)
  const veil = useSpring(veilTarget, { stiffness: 200, damping: 26 })
  // Externally driven (scroll-linked) → the deck follows `positionValue` directly
  // so it stays locked to the page scroll; otherwise it uses its own spring.
  const effectiveScrollX = positionValue ?? (prefersReducedMotion ? scrollX : springX)
  const tick = useTickAudio(enableAudio)

  // Scroll-driven mode: mirror the fractional position into activeIndex so the
  // centred card lights and handles clicks. No-op when self-driven.
  useMotionValueEvent(effectiveScrollX, 'change', (v) => {
    if (!positionValue) return
    const i = clampIndex(Math.round(v), items.length)
    if (i !== activeIndexRef.current) setActiveIndex(i)
  })

  useEffect(() => {
    // Drive the deck to the target position (RAW — a caller may hold it at a
    // fractional / off-index spot); the ACTIVE card still snaps to a real clamped
    // index for veils / clicks. The entrance sweep is a transient spring pre-roll
    // (see `appear` / `entranceOffset`), not a scrollX write here. scrollX.set is a
    // MotionValue write, not setState.
    scrollX.set(initialIndex)
    const clamped = clampIndex(initialIndex, items.length)
    if (clamped !== activeIndexRef.current) setActiveIndex(clamped)
  }, [initialIndex, items.length, scrollX])

  // On the rising edge of `appear`, pre-roll the SPRING to `entranceOffset` slots
  // RIGHT of the target and let it ease straight into focus — the deck sweeps in
  // from the side as ONE continuous motion (no separate slide, no unfocused hold /
  // gap before the first focus). entranceOffset 0 → materialize in place. Reduced
  // motion drives the deck off scrollX (not springX), so it's skipped. .jump is a
  // MotionValue write (no cascading render).
  const appearedRef = useRef(false)
  useEffect(() => {
    if (appear && !appearedRef.current && !prefersReducedMotion) {
      springX.jump(scrollX.get() - entranceOffset)
    }
    appearedRef.current = appear
  }, [appear, entranceOffset, prefersReducedMotion, springX, scrollX])

  useEffect(() => {
    if (!isMountedForCallbackRef.current) { isMountedForCallbackRef.current = true; return }
    onIndexChangeRef.current?.(activeIndex)
  }, [activeIndex])

  const jumpToIndex = useCallback(
    (index: number, velocity = 0, direction?: Direction) => {
      const clamped = clampIndex(index, items.length)
      const prev = activeIndexRef.current
      if (clamped === prev) return
      const dir: Direction = direction ?? (clamped > prev ? 'right' : 'left')
      setActiveIndex(clamped)
      scrollX.set(clamped)
      tick(dir, velocity)
    },
    [items.length, scrollX, tick],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Scroll-driven decks are controlled by the page scroll; never capture wheel.
    if (positionValue) return

    let accumulator = 0
    let lastTime = Date.now()
    let lastJump = 0

    const handleWheel = (e: WheelEvent) => {
      if (!enableScrollRef.current) return
      const vertical = orientation === 'vertical'
      // React to the deck's own axis; let the cross axis fall through to the page.
      const primary = vertical ? e.deltaY : e.deltaX
      const cross = vertical ? e.deltaX : e.deltaY
      if (Math.abs(cross) > Math.abs(primary)) return

      // Vertical only: at the first/last cover, release the wheel in the
      // outward direction so the page scrolls on to the next/prev project
      // instead of trapping the reader inside the deck.
      if (vertical) {
        const at = activeIndexRef.current
        if ((primary > 0 && at >= items.length - 1) || (primary < 0 && at <= 0)) return
      }
      e.preventDefault()

      const now = Date.now()
      if (now - lastTime > 200) accumulator = 0
      lastTime = now
      accumulator += primary

      const threshold = scrollThresholdRef.current
      const shouldJump =
        (accumulator > threshold || accumulator < -threshold) &&
        now - lastJump > 150

      if (shouldJump) {
        const dir = accumulator > 0 ? 'right' : 'left'
        jumpToIndex(Math.round(scrollX.get()) + (dir === 'right' ? 1 : -1), Math.abs(primary), dir)
        accumulator = 0
        lastJump = now
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [jumpToIndex, scrollX, orientation, items.length, positionValue])

  const handleCardClick = useCallback(
    (item: CoverFlowItem, index: number) => {
      // Scroll-driven decks own their position via the page scroll, so they
      // can't snap on click. Route ANY card click to onItemClick (open the item)
      // instead of firing a no-op jump that would transiently desync activeIndex.
      if (positionValue || index === activeIndexRef.current) {
        onItemClickRef.current?.(item, index)
      } else if (enableClickToSnapRef.current) {
        jumpToIndex(index)
      }
    },
    [jumpToIndex, positionValue],
  )

  // Called on a card's mousemove. Debounced (100ms): while the pointer keeps
  // moving the timer resets, so it fires once the pointer settles on a card.
  // Hovering the already-centered card is a no-op, so nothing repeats until the
  // pointer actually moves onto a different card.
  const handleCardHover = useCallback(
    (index: number) => {
      if (!enableHoverSlideRef.current) return
      if (index === activeIndexRef.current) return
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => jumpToIndex(index), 100)
    },
    [jumpToIndex],
  )

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }, [])

  const onDragStart = useCallback(() => setIsDragging(true), [])

  const onDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      const delta = orientation === 'vertical' ? info.delta.y : info.delta.x
      scrollX.set(scrollX.get() - delta / (effectiveCenterGap * 0.8))
    },
    [effectiveCenterGap, orientation, scrollX],
  )

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false)
      const velocity = orientation === 'vertical' ? info.velocity.y : info.velocity.x
      const projected = scrollX.get() - velocity * 0.002
      const clamped = clampIndex(Math.round(projected), items.length)
      const prev = activeIndexRef.current
      const dir: Direction = clamped >= prev ? 'right' : 'left'
      setActiveIndex(clamped)
      scrollX.set(clamped)
      if (clamped !== prev) tick(dir, Math.abs(velocity))
    },
    [items.length, orientation, scrollX, tick],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
      if (e.key === prevKey) { e.preventDefault(); jumpToIndex(activeIndexRef.current - 1, 120, 'left') }
      if (e.key === nextKey) { e.preventDefault(); jumpToIndex(activeIndexRef.current + 1, 120, 'right') }
    },
    [jumpToIndex, orientation],
  )

  if (items.length === 0) return null

  return (
    <>
      {reflectionFilterId && (
        <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id={reflectionFilterId} x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.065" numOctaves="3" seed="8" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="0.4 1.8" />
            </filter>
          </defs>
        </svg>
      )}
      <motion.div
        ref={containerRef}
        className={`group/cf relative w-full h-full flex flex-col justify-center items-center overflow-visible bg-transparent focus:outline-none ${
          positionValue
            ? 'touch-auto'
            : orientation === 'vertical'
              ? 'touch-pan-x'
              : 'touch-pan-y'
        } ${
          positionValue ? '' : isDragging ? 'is-dragging cursor-grabbing' : 'cursor-grab'
        } ${className ?? ''}`}
        style={{ perspective: 1000 }}
        role="region"
        aria-label="Cover Flow"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => {
          spreadTarget.set(hoverExpand)
          if (hoverRevealSides) veilTarget.set(0)
        }}
        onMouseLeave={() => {
          spreadTarget.set(1)
          veilTarget.set(sideVeilOpacity)
        }}
        drag={positionValue ? false : orientation === 'vertical' ? 'y' : 'x'}
        // Pin the DRAG axis to 0 so the container itself never translates — the
        // gesture only feeds scrollX (which moves the cards). Must match `drag`:
        // vertical pins top/bottom, horizontal pins left/right. A left/right pin
        // on a vertical drag leaves Y unbounded, so the deck would slide away and
        // never return (dragElastic=0, no snap-to-origin).
        dragConstraints={
          orientation === 'vertical'
            ? { top: 0, bottom: 0 }
            : { left: 0, right: 0 }
        }
        dragElastic={0}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, index) => (
            <CoverFlowItemCard
              key={item.id}
              item={item}
              index={index}
              scrollX={effectiveScrollX}
              width={effectiveWidth}
              height={effectiveHeight}
              stackSpacing={effectiveStackSpacing}
              centerGap={effectiveCenterGap}
              rotation={rotation}
              isActive={index === activeIndex}
              showReflection={showReflection}
              reflectionFilterId={reflectionFilterId}
              veil={veil}
              spread={spread}
              hoverLiftPx={hoverLiftPx}
              enableClickToSnap={enableClickToSnap}
              reduceMotion={prefersReducedMotion ?? false}
              orientation={orientation}
              renderImage={renderImage}
              onCardClick={handleCardClick}
              onCardHover={handleCardHover}
            />
          ))}
        </div>

        {showCaption && (
          <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
                className="text-center"
              >
                {/* Match the site's original sandbox hierarchy: text-h3 title over
                    a text-note / fg-muted subtitle (not the registry's 2xl).
                    text-note, not text-caption: the subtitle is prose, and
                    text-caption is the ALL-CAPS label token. */}
                <h3 className="text-h3 text-fg">{items[activeIndex]?.title}</h3>
                {items[activeIndex]?.subtitle && (
                  <p className="text-note mt-1 text-fg-muted">
                    {items[activeIndex]?.subtitle}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  )
}

interface CardProps {
  item: CoverFlowItem
  index: number
  scrollX: MotionValue<number>
  width: number
  height: number
  stackSpacing: number
  centerGap: number
  rotation: number
  isActive: boolean
  showReflection: boolean
  reflectionFilterId?: string
  veil: MotionValue<number>
  spread: MotionValue<number>
  hoverLiftPx: number
  enableClickToSnap: boolean
  reduceMotion: boolean
  orientation: 'horizontal' | 'vertical'
  renderImage?: (props: RenderImageProps) => ReactNode
  onCardClick: (item: CoverFlowItem, index: number) => void
  onCardHover: (index: number) => void
}

const CoverFlowItemCard = memo(function CoverFlowItemCard({
  item,
  index,
  scrollX,
  width,
  height,
  stackSpacing,
  centerGap,
  rotation,
  isActive,
  showReflection,
  reflectionFilterId,
  veil,
  spread,
  hoverLiftPx,
  enableClickToSnap,
  reduceMotion,
  orientation,
  renderImage,
  onCardClick,
  onCardHover,
}: CardProps) {
  const rotate = useTransform(scrollX, (value) => {
    if (reduceMotion) return 0
    const pos = index - value
    const absPos = Math.abs(pos)
    const base = absPos < 0.5 ? -pos * (rotation * 2) : pos < 0 ? rotation : -rotation
    // Vertical tilts around the X axis; the sign flips so each off-centre card's
    // edge nearest the centre leans toward the viewer (a vertical cover flow).
    return orientation === 'vertical' ? -base : base
  })

  // Multiplied by `spread` (1 = normal) so hovering the deck fans the cards apart.
  const offset = useTransform(
    [scrollX, spread] as MotionValue<number>[],
    (latest: number[]) => {
      const value = latest[0]
      const sp = latest[1]
      const pos = index - value
      const absPos = Math.abs(pos)
      const base =
        absPos < 1
          ? pos * centerGap
          : pos < 0
            ? -centerGap - (absPos - 1) * stackSpacing
            : centerGap + (absPos - 1) * stackSpacing
      return base * sp
    },
  )

  const z = useTransform(scrollX, (value) => {
    if (reduceMotion) return 0
    const absPos = Math.abs(index - value)
    return absPos > 0.5 ? -200 : absPos * -400
  })

  const zIndex = useTransform(scrollX, (value) => 1000 - Math.abs(index - value) * 10)

  // Off-centre cards fade toward WHITE (a #ffffff veil), not darkened, so the
  // deck reads cleanly on the light canvas; the centred card stays fully opaque.
  const veilOpacity = useTransform(
    [scrollX, veil] as MotionValue<number>[],
    (latest: number[]) => (Math.abs(index - latest[0]) < 0.5 ? 0 : latest[1]),
  )

  const imageRenderer = renderImage ?? defaultRenderImage
  const cursorClass = isActive || enableClickToSnap ? 'cursor-pointer' : 'cursor-grab'

  return (
    <motion.div
      className={`absolute top-1/2 left-1/2 preserve-3d will-change-transform group-[.is-dragging]/cf:!cursor-grabbing ${cursorClass}`}
      // Lift the hovered card straight up (horizontal decks only — vertical decks
      // drive `y` via the offset, so a y-lift there would fight it). Sprung.
      whileHover={
        hoverLiftPx && orientation === 'horizontal'
          ? {
              y: -hoverLiftPx,
              transition: { type: 'spring', stiffness: 400, damping: 30 },
            }
          : undefined
      }
      style={{
        width,
        height,
        marginTop: -height / 2,
        marginLeft: -width / 2,
        ...(orientation === 'vertical'
          ? { y: offset, rotateX: rotate }
          : { x: offset, rotateY: rotate }),
        z,
        zIndex,
        pointerEvents: 'auto',
      }}
      onClick={() => onCardClick(item, index)}
      onMouseMove={() => onCardHover(index)}
    >
      <div className="relative w-full h-full shadow-2xl bg-white">
        {/* #ffffff veil — fades off-centre cards toward the canvas, not to black. */}
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none z-30"
          style={{ opacity: veilOpacity }}
        />
        <div className="relative w-full h-full overflow-hidden">
          {imageRenderer({
            src: item.image,
            alt: item.title,
            width,
            height,
            className: 'object-cover select-none pointer-events-none w-full h-full',
            draggable: false,
            sizes: `${width}px`,
            priority: isActive,
            loading: isActive ? 'eager' : 'lazy',
          })}
          <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-0 dark:opacity-20 pointer-events-none z-10" />
        </div>
      </div>

      {showReflection && (
        <div
          aria-hidden="true"
          className="absolute left-0 pointer-events-none overflow-hidden"
          style={{
            top: '100%',
            width,
            height: height * 0.42,
            marginTop: 1,
            transformOrigin: 'top center',
            transform: 'rotateX(12deg) translateZ(0)',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: 'scaleY(-1)',
              filter: reflectionFilterId ? `url(#${reflectionFilterId})` : undefined,
              mixBlendMode: reflectionFilterId ? 'screen' : undefined,
              opacity: reflectionFilterId ? 0.55 : 0.4,
            }}
          >
            <div className={`relative w-full h-full bg-black ${reflectionFilterId ? 'shadow-2xl' : ''}`}>
              <div className="relative w-full h-full overflow-hidden">
                {imageRenderer({
                  src: item.image,
                  alt: '',
                  width,
                  height,
                  className: 'object-cover w-full h-full',
                  draggable: false,
                  sizes: `${width}px`,
                  loading: 'lazy',
                })}
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.7) 40%, transparent 100%)',
            }}
          />
        </div>
      )}
    </motion.div>
  )
})
