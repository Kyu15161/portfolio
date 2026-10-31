"use client";

import React, { useState, useEffect } from "react";

export default function ShutterTransition() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleShutter = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      setActive(true);
      setTimeout(() => setActive(false), 140);
    };

    window.addEventListener("portfolio:shutter", handleShutter);
    return () => window.removeEventListener("portfolio:shutter", handleShutter);
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none bg-[#110e0c]/65 transition-opacity duration-150 ease-out"
      aria-hidden="true"
    />
  );
}
