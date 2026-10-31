"use client";

import React, { useRef, useEffect, useCallback, ReactNode } from "react";

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  maxShift?: number;
  className?: string;
}

export function Magnetic({
  children,
  strength = 0.28,
  maxShift = 12,
  className = "",
}: MagneticProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const ensureLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    function tick() {
      const el = wrapRef.current;
      if (!el) {
        runningRef.current = false;
        rafRef.current = null;
        return;
      }

      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;
      const distSq = dx * dx + dy * dy;

      if (
        distSq < 0.02 &&
        targetRef.current.x === 0 &&
        targetRef.current.y === 0
      ) {
        currentRef.current.x = 0;
        currentRef.current.y = 0;
        el.style.transform = "translate3d(0px, 0px, 0)";
        runningRef.current = false;
        rafRef.current = null;
        return;
      }

      currentRef.current.x += dx * 0.18;
      currentRef.current.y += dy * 0.18;
      el.style.transform = `translate3d(${currentRef.current.x.toFixed(2)}px, ${currentRef.current.y.toFixed(2)}px, 0)`;

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      if (
        typeof window === "undefined" ||
        !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)")
          .matches
      ) {
        return;
      }
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawX = (e.clientX - cx) * strength;
      const rawY = (e.clientY - cy) * strength;

      targetRef.current = {
        x: Math.max(-maxShift, Math.min(maxShift, rawX)),
        y: Math.max(-maxShift, Math.min(maxShift, rawY)),
      };
      ensureLoop();
    },
    [strength, maxShift, ensureLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    ensureLoop();
  }, [ensureLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      runningRef.current = false;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-flex ${className}`}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
}

interface TiltPlateProps {
  children: ReactNode;
  tint?: string;
  maxTilt?: number;
  className?: string;
}

export function TiltPlate({
  children,
  tint = "#e26947",
  maxTilt = 4.5,
  className = "",
}: TiltPlateProps) {
  const plateRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      if (
        typeof window === "undefined" ||
        !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)")
          .matches
      ) {
        return;
      }
      const el = plateRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const rx = (0.5 - py) * maxTilt * 2;
      const ry = (px - 0.5) * maxTilt * 2;

      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--tilt-scale", "1.01");
      el.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--glare-opacity", "1");
    },
    [maxTilt]
  );

  const handlePointerLeave = useCallback(() => {
    const el = plateRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tilt-scale", "1");
    el.style.setProperty("--glare-opacity", "0");
  }, []);

  return (
    <div
      ref={plateRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`tilt-plate print-mat relative overflow-hidden ${className}`}
      style={{ "--card-tint": tint } as React.CSSProperties}
    >
      {children}
      <div
        className="tilt-glare pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
      />
    </div>
  );
}
