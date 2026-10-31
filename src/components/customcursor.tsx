"use client";

import React, { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

function subscribePointerPrefs(callback: () => void) {
  const mql = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getPointerPrefsSnapshot() {
  return window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
}

function getPointerPrefsServerSnapshot() {
  return false;
}

export default function CustomCursor() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const finePointerAllowed = useSyncExternalStore(
    subscribePointerPrefs,
    getPointerPrefsSnapshot,
    getPointerPrefsServerSnapshot
  );

  const enabled = finePointerAllowed && !isAdmin;

  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isInsideWindow, setIsInsideWindow] = useState(true);
  const [isOverInput, setIsOverInput] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: -120, y: -120 });
  const targetRef = useRef({ x: -120, y: -120 });
  const hoveredElRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove("custom-cursor-active");
      return;
    }

    document.body.classList.add("custom-cursor-active");

    let animId: number | null = null;
    let isRunning = false;

    const attrObserver = new MutationObserver(() => {
      const currentEl = hoveredElRef.current;
      if (!currentEl) return;
      const nextLabel = currentEl.getAttribute("data-cursor") || "";
      setCursorText(nextLabel);
      setIsHovered(Boolean(nextLabel));
    });

    const bindHoveredElement = (nextEl: Element | null) => {
      if (hoveredElRef.current === nextEl) return;
      attrObserver.disconnect();
      hoveredElRef.current = nextEl;
      if (nextEl) {
        attrObserver.observe(nextEl, {
          attributes: true,
          attributeFilter: ["data-cursor"],
        });
      }
    };

    const updatePhysics = () => {
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 0.01) {
        posRef.current.x = targetRef.current.x;
        posRef.current.y = targetRef.current.y;
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
        }
        isRunning = false;
        animId = null;
        return;
      }

      posRef.current.x += dx * 0.22;
      posRef.current.y += dy * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(updatePhysics);
    };

    const wakeUp = () => {
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(updatePhysics);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setIsInsideWindow(true);
      wakeUp();
    };

    const onMouseLeave = () => {
      setIsInsideWindow(false);
    };

    const onMouseEnter = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setIsInsideWindow(true);
      wakeUp();
    };

    const syncTarget = (target: HTMLElement | null) => {
      if (!target) return;

      const overFormInput = Boolean(
        target.closest("input, select, textarea, [contenteditable='true']")
      );
      setIsOverInput(overFormInput);

      const interactive = target.closest("[data-cursor]");
      if (interactive) {
        bindHoveredElement(interactive);
        const text = interactive.getAttribute("data-cursor") || "";
        setCursorText(text);
        setIsHovered(Boolean(text));
      } else {
        bindHoveredElement(null);
        setCursorText("");
        setIsHovered(false);
      }

      const clickable = target.closest("button, a, [role='button']");
      setIsPointer(Boolean(clickable) && !overFormInput);
    };

    const handleMouseOver = (e: MouseEvent) => {
      syncTarget(e.target as HTMLElement | null);
    };

    const handleClick = (e: MouseEvent) => {
      syncTarget(e.target as HTMLElement | null);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });

    return () => {
      attrObserver.disconnect();
      hoveredElRef.current = null;
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      isRunning = false;
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("click", handleClick);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [enabled]);

  if (!enabled) return null;

  const isVisible = isInsideWindow && !isOverInput;
  const isCopiedBadge = cursorText.toUpperCase() === "COPIED";

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-50 pointer-events-none w-20 h-20 flex items-center justify-center"
      style={{
        willChange: "transform",
        contain: "layout style paint",
      }}
      aria-hidden="true"
    >
      <div
        className={`w-full h-full rounded-full flex items-center justify-center transition-[transform,opacity,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          !isVisible
            ? "opacity-0 scale-0"
            : isHovered
            ? isCopiedBadge
              ? "opacity-100 scale-100 bg-[#1a2219]/95 border border-[#8ec07c]"
              : "opacity-100 scale-100 border"
            : isPointer
            ? "opacity-95 scale-[0.42] border"
            : "opacity-95 scale-[0.16] border border-[#f4ede2]/80"
        }`}
        style={
          isHovered && !isCopiedBadge
            ? {
                backgroundColor:
                  "color-mix(in oklab, var(--ambient-color) 18%, rgba(20, 16, 14, 0.92))",
                borderColor: "color-mix(in oklab, var(--ambient-color) 78%, #f4ede2)",
                boxShadow:
                  "0 12px 30px -10px color-mix(in oklab, var(--ambient-color) 45%, rgba(0,0,0,0.85))",
              }
            : isPointer && !isHovered
            ? {
                backgroundColor:
                  "color-mix(in oklab, var(--ambient-color) 24%, transparent)",
                borderColor: "color-mix(in oklab, var(--ambient-color) 82%, #f4ede2)",
              }
            : !isHovered && !isPointer
            ? {
                backgroundColor: "var(--ambient-color)",
              }
            : undefined
        }
      >
        {cursorText && isHovered && (
          <span
            className={`font-mono text-[10px] font-medium uppercase tracking-[0.16em] select-none text-center px-1.5 leading-none ${
              isCopiedBadge ? "text-[#a9d896]" : "text-[#f4ede2]"
            }`}
          >
            {cursorText}
          </span>
        )}
      </div>
    </div>
  );
}
