"use client";

import { useEffect, useRef, useState } from "react";

const MAX_DPR = 2;
const PRELOAD_COUNT = 24;
const BATCH_SIZE = 8;

function pad3(n) {
  return String(n).padStart(3, "0");
}

// Returns 0->1->0 across [inStart, inEnd] fade-in, hold, [outStart, outEnd] fade-out
function fadeWindow(progress, inStart, inEnd, outStart, outEnd) {
  if (progress <= inStart) return 0;
  if (progress < inEnd) return (progress - inStart) / (inEnd - inStart);
  if (progress <= outStart) return 1;
  if (progress < outEnd) return 1 - (progress - outStart) / (outEnd - outStart);
  return 0;
}

/**
 * Plays a sequence of frame images on a <canvas>, driven by scroll position
 * inside a tall "stage". The stage is pinned (position: sticky) for its
 * scrollable height, during which the active frame advances with scroll.
 *
 * Props:
 *  - frameCount: total number of frames (e.g. 117)
 *  - framePrefix: path prefix, frames are "${framePrefix}${index}.webp"
 *  - scrollHeight: how tall the scroll stage is (controls how much scrolling
 *    it takes to play through all frames). Default "220vh".
 *  - children: left-aligned overlay content (headline, CTAs), visible early,
 *    fades out by ~28% scroll progress
 *  - centerContent: center-screen overlay (e.g. big "PRODUCTIVITY" text),
 *    fades in around 30%, holds through the animation's dramatic middle,
 *    fades out again before the finale so nothing blocks the payoff shot
 *  - showScrollHint: shows a bouncing scroll-down arrow for the first ~12%
 *  - fallback: rendered instead of the canvas if frames fail to load
 */
export default function ScrollFramePlayer({
  frameCount,
  framePrefix,
  scrollHeight = "220vh",
  children,
  centerContent,
  showScrollHint = true,
  fallback,
}) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const centerRef = useRef(null);
  const arrowRef = useRef(null);
  const imagesRef = useRef([]);
  const loadedCountRef = useRef(0);
  const currentDrawnRef = useRef(-1);
  const dprRef = useRef(1);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Preload frames: first batch blocks "ready", rest load in background batches
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;

    const loadOne = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCountRef.current += 1;
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = `${framePrefix}${pad3(i)}.webp`;
        imagesRef.current[i] = img;
      });

    (async () => {
      const first = [];
      for (let i = 0; i < Math.min(PRELOAD_COUNT, frameCount); i++) first.push(loadOne(i));
      const results = await Promise.all(first);
      if (cancelled) return;

      if (results.every((ok) => !ok)) {
        setFailed(true);
        return;
      }
      setReady(true);

      for (let i = PRELOAD_COUNT; i < frameCount; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, frameCount); j++) batch.push(loadOne(j));
        await Promise.all(batch);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reducedMotion, frameCount, framePrefix]);

  // Size + draw + scroll binding
  useEffect(() => {
    if (reducedMotion || failed || !ready) return;

    const sizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      dprRef.current = dpr;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (index) => {
      const canvas = canvasRef.current;
      const img = imagesRef.current[index];
      if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext("2d");
      const dpr = dprRef.current;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      currentDrawnRef.current = index;
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = totalScrollable > 0 ? Math.min(1, Math.max(0, scrolled / totalScrollable)) : 0;

      const maxLoadedIndex = Math.max(0, loadedCountRef.current - 1);
      const targetIndex = Math.min(maxLoadedIndex, Math.round(progress * (frameCount - 1)));
      if (targetIndex !== currentDrawnRef.current) {
        drawFrame(targetIndex);
      }

      if (overlayRef.current) {
        const fade = Math.min(1, progress / 0.28);
        overlayRef.current.style.opacity = String(1 - fade);
        overlayRef.current.style.transform = `translateY(${-fade * 24}px)`;
      }

      if (centerRef.current) {
        const v = fadeWindow(progress, 0.3, 0.46, 0.62, 0.8);
        centerRef.current.style.opacity = String(v);
        centerRef.current.style.transform = `translateY(${(1 - v) * 16}px) scale(${0.94 + v * 0.06})`;
      }

      if (arrowRef.current) {
        arrowRef.current.style.opacity = String(Math.max(0, 1 - progress / 0.12));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      sizeCanvas();
      update();
    };

    sizeCanvas();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [ready, reducedMotion, failed, frameCount]);

  // Respect reduced motion: static final frame, no scroll-jacking
  if (reducedMotion) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src={`${framePrefix}${pad3(frameCount - 1)}.webp`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 bg-gradient-to-r from-[#030611] via-[#030611]/80 to-transparent" />
        <div className="relative z-10 h-full flex items-center">{children}</div>
      </div>
    );
  }

  // Total load failure: graceful fallback, e.g. the CSS-only orbit hero
  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <div ref={stageRef} style={{ height: scrollHeight }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 bg-gradient-to-r from-[#030611] via-[#030611]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#030611] to-transparent pointer-events-none" />

        <div
          ref={overlayRef}
          className="relative z-10 h-full flex items-center transition-opacity"
          style={{ willChange: "opacity, transform" }}
        >
          {children}
        </div>

        {centerContent && (
          <div
            ref={centerRef}
            className="absolute inset-0 z-10 flex items-center justify-center text-center px-6 pointer-events-none"
            style={{ opacity: 0, willChange: "opacity, transform" }}
          >
            {centerContent}
          </div>
        )}

        {showScrollHint && (
          <div
            ref={arrowRef}
            className="absolute bottom-8 inset-x-0 z-10 flex flex-col items-center gap-2 pointer-events-none"
          >
            <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">Scroll</span>
            <svg className="scroll-arrow-bounce" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#030611]">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
