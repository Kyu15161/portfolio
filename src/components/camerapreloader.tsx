"use client";

import React, { useEffect, useState } from "react";

export default function CameraPreloader() {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      if (sessionStorage.getItem("camera_preloader_shown") === "true") {
        return;
      }
      sessionStorage.setItem("camera_preloader_shown", "true");
    } catch {
      // Fallback if sessionStorage is unavailable
    }

    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 550);

    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 980);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#110e0c] flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-[#e26947]/50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#e26947]/80" />
        </div>
        <span className="font-serif italic text-xl text-[#f4ede2] tracking-tight leading-[1.1] pb-1">
          Maren Lindqvist
        </span>
      </div>
    </div>
  );
}
