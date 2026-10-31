"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Aperture, SlidersHorizontal } from "lucide-react";
import { Magnetic } from "./magnetic";

interface CameraNavbarProps {
  siteTitle?: string;
}

const NAV_ITEMS = [
  { label: "Reel", href: "#reel" },
  { label: "Works", href: "#works" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export default function CameraNavbar({
  siteTitle = "Maren Lindqvist",
}: CameraNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-40 select-none px-3 sm:px-6 pt-3 pointer-events-none">
      <a
        href="#works"
        className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#e26947] focus:text-[#110e0c] focus:font-semibold focus:text-xs"
      >
        Skip to selected works
      </a>

      {/* Floating Darkroom Glass Island */}
      <div className="pointer-events-auto max-w-7xl mx-auto rounded-full darkroom-glass border border-[#3a3029]/90 px-4 sm:px-6 h-14 flex items-center justify-between gap-4 relative overflow-hidden">
        {/* Photographer Wordmark */}
        <div className="flex items-center shrink-0">
          <Magnetic strength={0.2} maxShift={8}>
            <a
              href="#top"
              onClick={() => setMobileOpen(false)}
              className="group flex items-center gap-2.5 text-[#f4ede2] hover:text-[#e26947] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-4 rounded-full"
            >
              <span className="w-8 h-8 rounded-full bg-[#1f1915] border border-[#3f342c] flex items-center justify-center group-hover:border-[#e26947]/70 group-hover:bg-[#e26947]/15 transition-colors duration-300">
                <Aperture
                  strokeWidth={1.35}
                  className="w-4 h-4 text-[#d89b52] group-hover:text-[#e26947] transition-colors duration-300"
                />
              </span>
              <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#f4ede2]">
                {siteTitle}
              </span>
            </a>
          </Magnetic>
        </div>

        {/* Primary Chapter Navigation */}
        <nav
          aria-label="Portfolio chapters"
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#171210]/85 border border-[#332a23]"
        >
          {NAV_ITEMS.map((item) => (
            <Magnetic key={item.href} strength={0.24} maxShift={7}>
              <a
                href={item.href}
                className="px-4 py-1.5 text-xs font-medium rounded-full text-[#c6baa9] hover:text-[#f4ede2] hover:bg-[#261f1a] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2"
              >
                {item.label}
              </a>
            </Magnetic>
          ))}
        </nav>

        {/* Live Roll Exposure Readout, Darkroom CMS Link & Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181310]/80 border border-[#312923] text-[#a39686] font-mono text-[11px] tracking-wider tabular-nums"
            title="Film exposure and scroll readout"
          >
            <span
              className="color-swatch-chip w-2.5 h-2.5 rounded-full border border-[#f4ede2]/25 transition-colors duration-500"
              style={{ backgroundColor: "var(--ambient-color)" }}
              aria-hidden="true"
            />
            <span id="frame-exposure" className="text-[#d89b52]">
              EXP 01
            </span>
            <span className="text-[#4d4036]" aria-hidden="true">
              ·
            </span>
            <span id="frame-counter" className="text-[#c6baa9] font-medium">
              000%
            </span>
          </div>

          <Magnetic strength={0.24} maxShift={8}>
            <Link
              href="/admin"
              className="hidden sm:inline-flex group items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1f1916] hover:bg-[#2a221d] border border-[#3d322b] hover:border-[#e26947]/60 text-[#f4ede2] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-xs font-medium active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2"
              title="Open Darkroom CMS"
            >
              <SlidersHorizontal
                strokeWidth={1.35}
                className="w-3.5 h-3.5 text-[#d89b52] group-hover:text-[#e26947] transition-colors"
              />
              <span>Darkroom</span>
            </Link>
          </Magnetic>

          {/* Mobile Fluid Hamburger Button */}
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-chapter-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden relative w-9 h-9 rounded-full bg-[#1f1916] border border-[#3d322b] flex items-center justify-center text-[#f4ede2] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#e26947]"
          >
            <span
              className={`absolute w-4 h-[1.5px] bg-[#f4ede2] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                mobileOpen ? "rotate-45 translate-y-0" : "-translate-y-1"
              }`}
            />
            <span
              className={`absolute w-4 h-[1.5px] bg-[#f4ede2] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                mobileOpen ? "-rotate-45 translate-y-0" : "translate-y-1"
              }`}
            />
          </button>
        </div>

        {/* Compositor-driven scroll progress hairline */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden"
          aria-hidden="true"
        >
          <div className="scroll-progress-bar h-full w-full" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile Glass Drawer with Staggered Mask Reveal */}
      <div
        id="mobile-chapter-drawer"
        className={`md:hidden max-w-7xl mx-auto mt-2 rounded-3xl darkroom-glass border border-[#3a3029]/90 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          mobileOpen
            ? "pointer-events-auto opacity-100 translate-y-0 max-h-80 p-5"
            : "pointer-events-none opacity-0 -translate-y-3 max-h-0 p-0 border-transparent"
        }`}
      >
        <nav aria-label="Mobile chapters" className="flex flex-col gap-2">
          {NAV_ITEMS.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{ transitionDelay: mobileOpen ? `${idx * 45}ms` : "0ms" }}
              className={`px-3 py-2 rounded-xl font-serif text-2xl text-[#f4ede2] hover:text-[#e26947] hover:bg-[#241d18]/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 mt-1 border-t border-[#332a23] flex items-center justify-between px-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a39686]">
              Archive CMS
            </span>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#221b17] border border-[#3d322b] text-xs font-medium text-[#f4ede2] hover:border-[#e26947]"
            >
              <SlidersHorizontal strokeWidth={1.35} className="w-3.5 h-3.5 text-[#d89b52]" />
              <span>Darkroom</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
