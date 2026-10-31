"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import CameraNavbar from "./cameranavbar";
import FeaturedReel from "./featuredreel";
import PhotoGallery, { PhotoItem } from "./photogallery";
import { Magnetic, TiltPlate } from "./magnetic";
import { useColorTheme, normalizeFilmTint } from "./reactivebackground";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUp,
  Copy,
  Check,
  Mail,
  Expand,
  SlidersHorizontal,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface MainPortfolioClientProps {
  initialPhotos: PhotoItem[];
  categories: { id: string; name: string; slug: string }[];
  siteConfig?: {
    title: string;
    tagline: string;
    aboutText: string;
    email: string;
    instagram?: string | null;
    twitter?: string | null;
  };
}

const EXHIBITIONS = [
  {
    year: "2026",
    title: "Low Tide, Sodium Light",
    format: "Solo exhibition",
    venue: "Fotografiska Annex, Stockholm",
  },
  {
    year: "2025",
    title: "Northern Quays",
    format: "Solo exhibition",
    venue: "Galleri Format, Malmo",
  },
  {
    year: "2025",
    title: "Concrete & Salt",
    format: "Group survey",
    venue: "C/O Berlin, Berlin",
  },
  {
    year: "2024",
    title: "Atlantic Margin",
    format: "Solo exhibition",
    venue: "Carpintarias de Sao Lazaro, Lisbon",
  },
  {
    year: "2023",
    title: "After Daylight",
    format: "Group exhibition",
    venue: "Brotkunsthalle, Vienna",
  },
  {
    year: "2022",
    title: "Port Cities in Color",
    format: "Triennial selection",
    venue: "Triennale der Photographie, Hamburg",
  },
] as const;

const INTERLUDE_LEAD =
  "Sodium vapor meets Atlantic fog for twenty minutes after sundown.";
const INTERLUDE_TAIL =
  "I plant the tripod on wet granite, meter for shadow detail beneath the hull, and wait until one ferry lamp crosses the channel.";

export default function MainPortfolioClient({
  initialPhotos,
  categories,
  siteConfig,
}: MainPortfolioClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [externalLightboxPhoto, setExternalLightboxPhoto] =
    useState<PhotoItem | null>(null);
  const [externalTriggerEl, setExternalTriggerEl] =
    useState<HTMLElement | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const { setCurrentColor } = useColorTheme();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroBackdropRef = useRef<HTMLDivElement | null>(null);
  const heroCopyRef = useRef<HTMLDivElement | null>(null);
  const interludeRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPhotos =
    activeCategory === "all"
      ? initialPhotos
      : initialPhotos.filter((p) => p.category?.slug === activeCategory);

  const leadPhoto =
    initialPhotos.find((p) => p.isFeatured) || initialPhotos[0] || null;
  const leadTint = normalizeFilmTint(leadPhoto?.dominantColor, "#e26947");

  // Select a rich atmospheric field plate for the Biography chapter
  const aboutPlate =
    initialPhotos.find(
      (p) => !p.isFeatured && p.url.startsWith("https://")
    ) ||
    initialPhotos[initialPhotos.length - 2] ||
    leadPhoto;

  // Select a warm harbor detail for the inline editorial typography pill
  const interludePillPhoto =
    initialPhotos.find(
      (p) => p.id !== leadPhoto?.id && p.url.startsWith("https://")
    ) || leadPhoto;

  const studioTitle = siteConfig?.title || "Maren Lindqvist";
  const studioTagline =
    siteConfig?.tagline || "Harbor light, wet stone, northern dusk.";
  const studioBio =
    siteConfig?.aboutText ||
    "I photograph coastal harbors and twilight transit corridors on medium-format color negative film.";
  const correspondenceEmail =
    siteConfig?.email && siteConfig.email !== "studio@marenlindqvist.se"
      ? siteConfig.email
      : "studio@marenlindqvist.com";

  const handleOpenPhotoInLightbox = useCallback(
    (photo: PhotoItem, triggerEl?: HTMLElement | null) => {
      window.dispatchEvent(new Event("portfolio:shutter"));
      if (photo.dominantColor) {
        setCurrentColor(photo.dominantColor);
      }
      setExternalTriggerEl(triggerEl ?? null);
      setExternalLightboxPhoto(photo);
    },
    [setCurrentColor]
  );

  const handleCopyStudioEmail = useCallback(() => {
    const markCopied = () => {
      setEmailCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setEmailCopied(false);
      }, 2800);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(correspondenceEmail).then(markCopied).catch(() => {
        markCopied();
      });
    } else {
      markCopied();
    }
  }, [correspondenceEmail]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Sync initial ambient color to lead photo on mount
  useEffect(() => {
    if (leadPhoto?.dominantColor) {
      setCurrentColor(leadPhoto.dominantColor);
    }
  }, [leadPhoto?.dominantColor, setCurrentColor]);

  // Passive rAF scroll progress + 36-exposure film frame counter in CameraNavbar
  useEffect(() => {
    let cachedTotalScroll = 0;
    let lastPercentage = -1;
    let lastExposure = -1;
    let ticking = false;
    let rafId: number | null = null;

    const updateDimensions = () => {
      const scrollHeight =
        document.documentElement.scrollHeight ||
        document.body.scrollHeight ||
        0;
      const innerHeight = window.innerHeight || 0;
      cachedTotalScroll = Math.max(0, scrollHeight - innerHeight);
    };

    const updateReadout = () => {
      ticking = false;
      const currentScroll = Math.max(
        0,
        window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0
      );

      let percentage = 0;
      if (cachedTotalScroll > 0) {
        percentage = Math.min(
          100,
          Math.max(0, Math.round((currentScroll / cachedTotalScroll) * 100))
        );
      }
      if (Number.isNaN(percentage) || !Number.isFinite(percentage)) {
        percentage = 0;
      }

      const exposure = Math.min(
        36,
        Math.max(1, Math.round((percentage / 100) * 35) + 1)
      );

      if (percentage !== lastPercentage) {
        lastPercentage = percentage;
        const frameCounter = document.getElementById("frame-counter");
        if (frameCounter) {
          frameCounter.textContent = `${String(percentage).padStart(3, "0")}%`;
        }
      }

      if (exposure !== lastExposure) {
        lastExposure = exposure;
        const exposureEl = document.getElementById("frame-exposure");
        if (exposureEl) {
          exposureEl.textContent = `EXP ${String(exposure).padStart(2, "0")}`;
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(updateReadout);
      }
    };

    const handleResize = () => {
      updateDimensions();
      handleScroll();
    };

    updateDimensions();
    updateReadout();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeCategory, filteredPhotos.length]);

  // GSAP Hero Staggered Clip Reveal, Hero Scrub, Scrubbed Editorial Interlude & Chapter Color Grading
  useGSAP(
    () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 1. Staggered clip-path line-by-line display reveal on Hero
        const heroLines = gsap.utils.toArray<HTMLElement>(
          ".hero-line-inner",
          rootEl
        );
        const heroFadeItems = gsap.utils.toArray<HTMLElement>(
          ".hero-fade-item",
          rootEl
        );

        if (heroLines.length > 0) {
          gsap.fromTo(
            heroLines,
            {
              yPercent: 105,
              clipPath: "inset(0% 0% 100% 0%)",
              opacity: 0,
            },
            {
              yPercent: 0,
              clipPath: "inset(-12% 0% -18% 0%)",
              opacity: 1,
              duration: 1.05,
              stagger: 0.12,
              ease: "power4.out",
              delay: 0.08,
            }
          );
        }

        if (heroFadeItems.length > 0) {
          gsap.fromTo(
            heroFadeItems,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.09,
              ease: "power3.out",
              delay: 0.28,
            }
          );
        }

        // 2. Hero ScrollTrigger scrub transition on scroll-out
        if (heroSectionRef.current) {
          ScrollTrigger.create({
            trigger: heroSectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            onEnter: () => setCurrentColor(leadTint),
            onEnterBack: () => setCurrentColor(leadTint),
          });

          if (heroBackdropRef.current) {
            gsap.to(heroBackdropRef.current, {
              scale: 1.09,
              yPercent: 10,
              ease: "none",
              scrollTrigger: {
                trigger: heroSectionRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.65,
              },
            });
          }

          if (heroCopyRef.current) {
            gsap.to(heroCopyRef.current, {
              yPercent: -14,
              opacity: 0.16,
              ease: "none",
              scrollTrigger: {
                trigger: heroSectionRef.current,
                start: "top top",
                end: "85% top",
                scrub: 0.55,
              },
            });
          }
        }

        // 3. Scrubbed Editorial Interlude word-by-word opacity reveal
        if (interludeRef.current) {
          const words = gsap.utils.toArray<HTMLElement>(
            ".interlude-word",
            interludeRef.current
          );
          if (words.length > 0) {
            gsap.fromTo(
              words,
              { opacity: 0.2 },
              {
                opacity: 1,
                stagger: 0.04,
                ease: "none",
                scrollTrigger: {
                  trigger: interludeRef.current,
                  start: "top 80%",
                  end: "bottom 52%",
                  scrub: 0.5,
                },
              }
            );
          }

          ScrollTrigger.create({
            trigger: interludeRef.current,
            start: "top 62%",
            end: "bottom 38%",
            onEnter: () => setCurrentColor("#d89b52"),
            onEnterBack: () => setCurrentColor("#d89b52"),
          });
        }

        // 4. About & Contact section scroll-driven ambient shifts + gentle GPU entry
        if (aboutRef.current) {
          ScrollTrigger.create({
            trigger: aboutRef.current,
            start: "top 58%",
            end: "bottom 42%",
            onEnter: () => setCurrentColor("#3b7a8c"),
            onEnterBack: () => setCurrentColor("#3b7a8c"),
          });

          const aboutBlocks = gsap.utils.toArray<HTMLElement>(
            ".about-reveal",
            aboutRef.current
          );
          aboutBlocks.forEach((block) => {
            gsap.fromTo(
              block,
              { opacity: 0, y: 26 },
              {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: block,
                  start: "top 88%",
                  once: true,
                },
              }
            );
          });
        }

        if (contactRef.current) {
          ScrollTrigger.create({
            trigger: contactRef.current,
            start: "top 62%",
            end: "bottom bottom",
            onEnter: () => setCurrentColor("#e26947"),
            onEnterBack: () => setCurrentColor("#e26947"),
          });
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const resetNodes = gsap.utils.toArray<HTMLElement>(
          ".hero-line-inner, .hero-fade-item, .interlude-word, .about-reveal",
          rootEl
        );
        if (resetNodes.length > 0) {
          gsap.set(resetNodes, { clearProps: "all" });
        }
        if (heroBackdropRef.current) {
          gsap.set(heroBackdropRef.current, { clearProps: "all" });
        }
        if (heroCopyRef.current) {
          gsap.set(heroCopyRef.current, { clearProps: "all" });
        }
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef, dependencies: [leadTint] }
  );

  // Reduced-motion section color shifts via IntersectionObserver
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pairs: Array<{ el: HTMLElement | null; color: string }> = [
      { el: heroSectionRef.current, color: leadTint },
      { el: interludeRef.current, color: "#d89b52" },
      { el: aboutRef.current, color: "#3b7a8c" },
      { el: contactRef.current, color: "#e26947" },
    ];

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = pairs.find((p) => p.el === entry.target);
            if (match) {
              setCurrentColor(match.color);
            }
          }
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0.1 }
    );

    pairs.forEach((p) => {
      if (p.el) io.observe(p.el);
    });
    return () => io.disconnect();
  }, [leadTint, setCurrentColor]);

  const handleBackToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const leadCameraSpecs = [
    leadPhoto?.exifCamera || "Hasselblad 500C/M",
    leadPhoto?.exifLens || "Planar 80mm f/2.8",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={rootRef}
      className="min-h-[100dvh] flex flex-col justify-between relative w-full max-w-full overflow-x-clip"
    >
      <CameraNavbar siteTitle={studioTitle} />

      {/* 1. CINEMATIC FULL-BLEED LETTERBOX HERO (#top) */}
      <section
        id="top"
        ref={heroSectionRef}
        aria-label="Opening monograph plate"
        className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-[#0c0a08]"
      >
        {/* Full-Bleed Lead Photograph with Ken Burns Drift & GSAP Exit Scrub */}
        <div
          ref={heroBackdropRef}
          className="absolute inset-0 z-0 overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {leadPhoto ? (
            <Image
              src={leadPhoto.url}
              alt={leadPhoto.title}
              fill
              preload
              sizes="100vw"
              className="object-cover hero-ken-burns opacity-78"
            />
          ) : (
            <div className="w-full h-full bg-[#15110e]" />
          )}

          {/* Warm Film Halation + Kodak Terracotta & Nordic Dusk Teal Light-Leak Wash */}
          <div
            className="hero-halation absolute inset-0"
            style={{ "--hero-tint": leadTint } as React.CSSProperties}
            aria-hidden="true"
          />
        </div>

        {/* Top Cinema Letterbox Bar (clears floating island navbar) */}
        <div className="relative z-10 w-full bg-[#0a0807]/86 border-b border-[#2b231d]/85 pt-20 pb-2.5 px-4 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[#a39686] tabular-nums">
            <span>KODAK PORTRA 400 · 120 MEDIUM FORMAT</span>
            <span className="hidden sm:inline text-[#d89b52]">
              STOCKHOLM · LISBON PRINT ARCHIVE
            </span>
          </div>
        </div>

        {/* Center-Wide Editorial Typography Stage & Contact Proof Trigger */}
        <div
          ref={heroCopyRef}
          className="relative z-10 flex-1 flex items-end lg:items-center max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-12 md:py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-end w-full">
            {/* Wide 2-Line Display H1 + Magnetic Button-in-Button CTAs */}
            <div className="lg:col-span-8 max-w-5xl">
              <div className="hero-fade-item mb-4">
                <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-[#16120f]/82 border border-[#43362e] text-[#f4ede2]">
                  <span
                    className="color-swatch-chip w-2 h-2 rounded-full"
                    style={{ backgroundColor: leadTint }}
                    aria-hidden="true"
                  />
                  Medium-Format Color & Architecture
                </span>
              </div>

              <h1 className="font-serif font-normal tracking-tight text-[#f4ede2] text-[clamp(2.85rem,5.4vw,5.4rem)] leading-[1.03]">
                <span className="block overflow-hidden pb-1">
                  <span className="hero-line-inner block">{studioTitle}</span>
                </span>
                <span className="block overflow-hidden pb-1.5 mt-1">
                  <span className="hero-line-inner block italic text-[#eab676] text-[clamp(1.75rem,3.3vw,3.35rem)] leading-[1.1]">
                    {studioTagline}
                  </span>
                </span>
              </h1>

              <p className="hero-fade-item max-w-2xl text-[#dfd4c5] text-base sm:text-lg leading-relaxed mt-5">
                {studioBio}
              </p>

              <div className="hero-fade-item mt-8 flex flex-wrap items-center gap-3.5">
                {leadPhoto && (
                  <Magnetic strength={0.28} maxShift={10}>
                    <button
                      type="button"
                      data-cursor="OPEN"
                      onClick={(e) =>
                        handleOpenPhotoInLightbox(leadPhoto, e.currentTarget)
                      }
                      className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#e26947] hover:bg-[#ec7553] text-[#110e0c] font-semibold text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f4ede2] focus-visible:outline-offset-2 shadow-lg"
                    >
                      <span>Inspect lead plate</span>
                      <span className="w-8 h-8 rounded-full bg-[#110e0c]/15 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                        <Expand strokeWidth={1.5} className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </Magnetic>
                )}

                <Magnetic strength={0.26} maxShift={10}>
                  <a
                    href="#reel"
                    className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#15110e]/88 hover:bg-[#221b17] border border-[#4a3c32] hover:border-[#d89b52]/70 text-[#f4ede2] text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2"
                  >
                    <span>Enter film reel</span>
                    <span className="w-8 h-8 rounded-full bg-[#f4ede2]/10 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:scale-105">
                      <ArrowDownRight strokeWidth={1.5} className="w-4 h-4 text-[#d89b52]" />
                    </span>
                  </a>
                </Magnetic>

                <Magnetic strength={0.22} maxShift={8}>
                  <a
                    href="#works"
                    className="px-4 py-2 text-xs font-mono uppercase tracking-[0.16em] text-[#dfd4c5] hover:text-[#e26947] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#e26947] rounded-full"
                  >
                    Selected works ({initialPhotos.length})
                  </a>
                </Magnetic>
              </div>
            </div>

            {/* Right-Side Tactile Contact Proof Window (Desktop Stage Control) */}
            {leadPhoto && (
              <div className="hero-fade-item hidden lg:flex lg:col-span-4 justify-end">
                <div
                  role="button"
                  tabIndex={0}
                  data-cursor="OPEN"
                  aria-label={`Open lead plate in lightbox: ${leadPhoto.title}`}
                  onClick={(e) =>
                    handleOpenPhotoInLightbox(leadPhoto, e.currentTarget)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenPhotoInLightbox(leadPhoto, e.currentTarget);
                    }
                  }}
                  className="group w-full max-w-[330px] double-bezel-shell p-1.5 rounded-[1.5rem] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-4 cursor-pointer"
                >
                  <TiltPlate
                    tint={leadTint}
                    maxTilt={5}
                    className="rounded-[calc(1.5rem-0.375rem)] p-2.5"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#0d0a09]">
                      <Image
                        src={leadPhoto.url}
                        alt=""
                        fill
                        sizes="330px"
                        loading="eager"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-2.5 px-1 flex items-center justify-between gap-2">
                      <span className="font-serif italic text-base text-[#f4ede2] truncate">
                        {leadPhoto.title}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d89b52] shrink-0">
                        Loupe
                      </span>
                    </div>
                  </TiltPlate>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Cinema Letterbox Plate Metadata Strip */}
        <div className="relative z-10 w-full bg-[#0a0807]/90 border-t border-[#2b231d]/90 py-3.5 px-4 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px] text-[#c6baa9] tabular-nums">
            <div className="truncate">
              <span className="text-[#a39686] uppercase tracking-wider mr-2">
                Series
              </span>
              <span className="text-[#f4ede2]">
                {leadPhoto?.category?.name || "Coast & Land"}
              </span>
            </div>
            <div className="truncate">
              <span className="text-[#a39686] uppercase tracking-wider mr-2">
                Optics
              </span>
              <span>{leadCameraSpecs}</span>
            </div>
            <div className="hidden md:block truncate">
              <span className="text-[#a39686] uppercase tracking-wider mr-2">
                Stock
              </span>
              <span>Kodak Portra 400 · C-41</span>
            </div>
            <div className="text-right truncate">
              <span className="text-[#a39686] uppercase tracking-wider mr-2">
                Index
              </span>
              <span className="text-[#e26947]">
                PLATE 01 / {String(initialPhotos.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PINNED HORIZONTAL FEATURED FILM REEL (#reel) */}
      <FeaturedReel
        photos={initialPhotos}
        onSelectPhoto={handleOpenPhotoInLightbox}
        onAmbientColorChange={setCurrentColor}
      />

      {/* SCRUBBED EDITORIAL INTERLUDE */}
      <section
        ref={interludeRef}
        aria-label="Field notes on light and exposure"
        className="relative py-28 md:py-40 px-4 sm:px-8 lg:px-12"
      >
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#d89b52] mb-6">
            Field Notebook · Civil Twilight
          </p>

          <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] text-[#f4ede2] leading-[1.18] tracking-tight">
            {INTERLUDE_LEAD.split(" ").map((word, idx) => (
              <React.Fragment key={`lead-${idx}`}>
                <span className="interlude-word inline-block">{word}</span>{" "}
              </React.Fragment>
            ))}
            {interludePillPhoto && (
              <span
                className="inline-block align-middle w-20 sm:w-28 h-9 sm:h-12 rounded-full overflow-hidden border border-[#56463b] mx-1.5 relative -translate-y-0.5 shadow-md"
                aria-hidden="true"
              >
                <Image
                  src={interludePillPhoto.url}
                  alt=""
                  fill
                  sizes="120px"
                  loading="lazy"
                  className="object-cover"
                />
              </span>
            )}{" "}
            {INTERLUDE_TAIL.split(" ").map((word, idx) => (
              <React.Fragment key={`tail-${idx}`}>
                <span
                  className={`interlude-word inline-block ${
                    idx >= INTERLUDE_TAIL.split(" ").length - 4
                      ? "italic text-[#d89b52]"
                      : ""
                  }`}
                >
                  {word}
                </span>{" "}
              </React.Fragment>
            ))}
          </p>
        </div>
      </section>

      {/* 3. SELECTED WORKS MONOGRAPH GRID (#works) */}
      <main id="works" className="flex-1 py-24 md:py-36 scroll-mt-16 relative">
        <div className="chromatic-divider mb-20 md:mb-28" aria-hidden="true" />

        <PhotoGallery
          photos={filteredPhotos}
          allPhotos={initialPhotos}
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          externalOpenPhoto={externalLightboxPhoto}
          externalTriggerEl={externalTriggerEl}
          onExternalClose={() => {
            setExternalLightboxPhoto(null);
            setExternalTriggerEl(null);
          }}
        />
      </main>

      {/* 4. BIOGRAPHY, EXHIBITIONS & DARKROOM PRACTICE (#about) */}
      <section
        id="about"
        ref={aboutRef}
        aria-labelledby="about-heading"
        className="relative py-28 md:py-40 scroll-mt-16"
      >
        <div className="chromatic-divider mb-20 md:mb-28" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Left 5 Columns: Field Plate & Medium-Format Darkroom Ledger */}
          <div className="lg:col-span-5 flex flex-col gap-6 about-reveal">
            {aboutPlate && (
              <div
                role="button"
                tabIndex={0}
                data-cursor="VIEW"
                aria-label={`Inspect field photograph: ${aboutPlate.title}`}
                onClick={(e) =>
                  handleOpenPhotoInLightbox(aboutPlate, e.currentTarget)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenPhotoInLightbox(aboutPlate, e.currentTarget);
                  }
                }}
                className="group w-full double-bezel-shell p-1.5 sm:p-2 rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-4 cursor-pointer"
              >
                <TiltPlate
                  tint={normalizeFilmTint(aboutPlate.dominantColor, "#3b7a8c")}
                  maxTilt={4}
                  className="rounded-[calc(1.75rem-0.5rem)] p-3"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#0e0b0a]">
                    <Image
                      src={aboutPlate.url}
                      alt={aboutPlate.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      loading="lazy"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 px-1 flex items-baseline justify-between gap-3">
                    <span className="font-serif italic text-lg text-[#f4ede2]">
                      {aboutPlate.title}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a39686] shrink-0">
                      {aboutPlate.exifCamera || "Hasselblad 500C/M"}
                    </span>
                  </div>
                </TiltPlate>
              </div>
            )}

            {/* Medium-Format & Silver-Gelatin Darkroom Notes */}
            <div className="double-bezel-shell p-1.5 rounded-[1.75rem]">
              <div className="double-bezel-core rounded-[calc(1.75rem-0.375rem)] p-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3b7a8c]">
                  Darkroom & Optical Apparatus
                </span>
                <h3 className="mt-2 font-serif text-2xl text-[#f4ede2]">
                  Medium-format negative to fiber paper
                </h3>
                <p className="mt-3 text-sm text-[#c6baa9] leading-relaxed">
                  I expose 6x6 and 6x7 roll film on a Hasselblad 500C/M, Mamiya
                  7 II, and Pentax 67II. Color negatives pass through an Imacon
                  Flextight drum scanner for archival pigment printing; black and
                  white rolls go onto an enlarger easel for selenium-toned
                  silver-gelatin prints on Ilford Multigrade FB Classic.
                </p>
              </div>
            </div>
          </div>

          {/* Right 7 Columns: Biography, Exhibitions & Editions */}
          <div className="lg:col-span-7 flex flex-col gap-12">
            <div className="about-reveal">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-[#172125] border border-[#2c4b57] text-[#7cc2d6]">
                Biography & Monograph Record
              </span>
              <h2
                id="about-heading"
                className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl text-[#f4ede2] tracking-tight leading-[1.08] max-w-3xl"
              >
                Twelve winters along northern quays and{" "}
                <span className="italic text-[#d89b52]">
                  Atlantic breakwaters.
                </span>
              </h2>

              <div className="mt-6 space-y-4 text-[#cfc3b4] text-base sm:text-lg leading-relaxed max-w-[62ch]">
                <p>
                  Born in Gothenburg in 1989, Maren Lindqvist divides the year
                  between a print room on Hornsgatan in Stockholm and a winter
                  field desk in Santos, Lisbon. She studied architectural
                  surveying at Chalmers before turning to roll film, and now
                  photographs ferry terminals, sea walls, and freight yards
                  during the last half hour of civil twilight.
                </p>
                <p>
                  Her color work pairs warm tungsten harbor lamps against Baltic
                  and North Atlantic slate. Collectors and public institutions
                  hold prints from three published monographs: Low Tide, Sodium
                  Light (2026), Atlantic Margin (2024), and Harbor Transit
                  (2021).
                </p>
              </div>
            </div>

            {/* Solo & Group Exhibitions Ledger */}
            <div className="about-reveal">
              <div className="flex items-baseline justify-between border-b border-[#332a23] pb-3 mb-5">
                <h3 className="font-serif text-2xl sm:text-3xl text-[#f4ede2]">
                  Solo & group exhibitions
                </h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#a39686]">
                  2022 to 2026
                </span>
              </div>

              <div className="divide-y divide-[#2b231d]">
                {EXHIBITIONS.map((ex) => (
                  <div
                    key={`${ex.year}-${ex.title}`}
                    className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 items-baseline"
                  >
                    <span className="sm:col-span-2 font-mono text-xs text-[#d89b52] tabular-nums">
                      {ex.year}
                    </span>
                    <span className="sm:col-span-5 font-serif text-xl text-[#f4ede2]">
                      {ex.title}
                    </span>
                    <span className="sm:col-span-5 text-sm text-[#c6baa9] sm:text-right">
                      {ex.format} · {ex.venue}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Editorial Commissions & Print Editions */}
            <div className="about-reveal grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="double-bezel-shell p-1.5 rounded-[1.5rem]">
                <div className="double-bezel-core h-full rounded-[calc(1.5rem-0.375rem)] p-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e26947]">
                    Commissions
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-[#f4ede2]">
                    Editorial & architectural
                  </h3>
                  <p className="mt-2.5 text-sm text-[#c6baa9] leading-relaxed">
                    I shoot architectural essays and harbor studies for
                    Arkitektur (Stockholm), Apartamento (Barcelona), Konfekt
                    (Zurich), MacGuffin (Amsterdam), and Courrier Japon (Tokyo).
                  </p>
                </div>
              </div>

              <div className="double-bezel-shell p-1.5 rounded-[1.5rem]">
                <div className="double-bezel-core h-full rounded-[calc(1.5rem-0.375rem)] p-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d89b52]">
                    Collector Editions
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-[#f4ede2]">
                    Signed runs of ten
                  </h3>
                  <p className="mt-2.5 text-sm text-[#c6baa9] leading-relaxed">
                    I print editions of ten on 308g Hahnemuhle Photo Rag in
                    50 x 62 cm and 80 x 100 cm plus two artist proofs. I sign
                    and number each reverse margin in graphite and ship in
                    custom birch crates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE COMMISSIONS & STUDIO CORRESPONDENCE (#contact) */}
      <section
        id="contact"
        ref={contactRef}
        aria-labelledby="contact-heading"
        className="relative py-28 md:py-40 scroll-mt-16"
      >
        <div className="chromatic-divider mb-20 md:mb-28" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="scrolly-chapter-glow double-bezel-shell p-2 sm:p-2.5 rounded-[2rem]">
            <div className="contact-atmosphere rounded-[calc(2rem-0.5rem)] border border-[#43362e]/80 p-7 sm:p-12 md:p-16">
              <div className="max-w-4xl">
                <span className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-[#1a1411]/90 border border-[#4a3b31] text-[#f4ede2]">
                  <span
                    className="w-2 h-2 rounded-full bg-[#e26947]"
                    aria-hidden="true"
                  />
                  Autumn & Winter 2026 · Booking Open
                </span>

                <h2
                  id="contact-heading"
                  className="mt-5 font-serif text-4xl sm:text-5xl md:text-6xl text-[#f4ede2] tracking-tight leading-[1.05]"
                >
                  Commission an architectural series or{" "}
                  <span className="italic text-[#eab676]">
                    acquire an edition print.
                  </span>
                </h2>

                <p className="mt-5 text-[#d7cbbd] text-base sm:text-lg leading-relaxed max-w-2xl">
                  Editors, architects, and collectors can copy the studio
                  address below or open a direct dispatch for print dimensions,
                  framing specifications, and European travel dates.
                </p>
              </div>

              {/* Large Tactile Magnetic Copy-Email Button + Direct Mailto */}
              <div className="mt-10 flex flex-col lg:flex-row lg:items-center gap-4">
                <Magnetic strength={0.2} maxShift={10} className="w-full lg:w-auto">
                  <button
                    type="button"
                    data-cursor={emailCopied ? "COPIED" : "COPY"}
                    onClick={handleCopyStudioEmail}
                    aria-label={`Copy studio email address ${correspondenceEmail}`}
                    className={`group w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 pl-6 pr-3 py-3.5 rounded-full border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f4ede2] focus-visible:outline-offset-4 ${
                      emailCopied
                        ? "bg-[#1d281c] border-[#8ec07c] text-[#f4ede2] shadow-[0_18px_44px_-16px_rgba(142,192,124,0.35)]"
                        : "bg-[#16120f]/92 hover:bg-[#211a16] border-[#524237] hover:border-[#e26947] text-[#f4ede2] shadow-xl"
                    }`}
                  >
                    <span className="font-serif text-xl sm:text-2xl md:text-3xl tracking-tight break-all text-left">
                      {correspondenceEmail}
                    </span>

                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.16em] shrink-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        emailCopied
                          ? "bg-[#8ec07c] text-[#111710] font-semibold"
                          : "bg-[#e26947] text-[#110e0c] font-semibold group-hover:translate-x-0.5"
                      }`}
                    >
                      {emailCopied ? (
                        <>
                          <Check strokeWidth={1.6} className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy strokeWidth={1.5} className="w-3.5 h-3.5" />
                          <span>Copy email</span>
                        </>
                      )}
                    </span>
                  </button>
                </Magnetic>

                <Magnetic strength={0.26} maxShift={9}>
                  <a
                    href={`mailto:${correspondenceEmail}`}
                    className="group inline-flex items-center justify-between gap-3 pl-6 pr-2.5 py-3.5 rounded-full bg-[#241d18]/90 hover:bg-[#2f251f] border border-[#4c3e34] hover:border-[#7cc2d6]/70 text-[#f4ede2] text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mail strokeWidth={1.35} className="w-4 h-4 text-[#7cc2d6]" />
                      <span>Direct mailto</span>
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#f4ede2]/10 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight strokeWidth={1.4} className="w-4 h-4 text-[#d89b52]" />
                    </span>
                  </a>
                </Magnetic>

                <span className="sr-only" aria-live="polite">
                  {emailCopied
                    ? `Copied ${correspondenceEmail} to clipboard`
                    : ""}
                </span>
              </div>

              {/* Stockholm & Lisbon Studio Dispatches */}
              <div className="mt-12 pt-10 border-t border-[#3b3028]/85 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#15110e]/80 border border-[#362c25]">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#e26947]">
                    <span>Stockholm Print Room</span>
                    <span>59.3172 N · 18.0560 E</span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl text-[#f4ede2]">
                    Hornsgatan, Sodermalm
                  </h3>
                  <p className="mt-2 text-sm text-[#c6baa9] leading-relaxed">
                    Primary archive, Flextight drum scanning, pigment &
                    silver-gelatin darkroom, and private print viewings from
                    April through December.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#15110e]/80 border border-[#362c25]">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#7cc2d6]">
                    <span>Lisbon Winter Desk</span>
                    <span>38.7078 N · 9.1525 W</span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl text-[#f4ede2]">
                    Rua da Boavista, Santos
                  </h3>
                  <p className="mt-2 text-sm text-[#c6baa9] leading-relaxed">
                    Atlantic harbor studies and Iberian architectural
                    assignments from January through March.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CINEMATIC COLOPHON / FOOTER */}
      <footer className="border-t border-[#2d251f] bg-[#0e0b0a] px-4 sm:px-8 lg:px-12 py-12 text-xs text-[#a39686]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#251e19]">
          <div className="md:col-span-5">
            <p className="font-serif text-2xl text-[#f4ede2]">{studioTitle}</p>
            <p className="mt-2 text-sm text-[#c6baa9] max-w-md leading-relaxed">
              I print medium-format color and architectural photographs in
              signed editions of ten in Stockholm.
            </p>
          </div>

          <div className="md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d89b52]">
              Film Stocks & Papers
            </p>
            <p className="mt-2 text-xs text-[#c6baa9] leading-relaxed font-mono">
              Kodak Portra 160 · Portra 400 · Tri-X 400
              <br />
              308g Hahnemuhle Photo Rag · Ilford FB Classic
            </p>
          </div>

          <div className="md:col-span-3 flex flex-col md:items-end justify-between gap-4">
            <Magnetic strength={0.26} maxShift={8}>
              <button
                type="button"
                onClick={handleBackToTop}
                className="group inline-flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-full bg-[#1a1512] hover:bg-[#261f1a] border border-[#3a3029] hover:border-[#e26947] text-[#f4ede2] text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947]"
              >
                <span>Back to top</span>
                <span className="w-6 h-6 rounded-full bg-[#f4ede2]/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5">
                  <ArrowUp strokeWidth={1.4} className="w-3.5 h-3.5 text-[#e26947]" />
                </span>
              </button>
            </Magnetic>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[11px] text-[#a39686]">
            © 2026 {studioTitle} · Stockholm & Lisbon
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#c6baa9]">
            <a href="#reel" className="hover:text-[#e26947] transition-colors">
              Reel
            </a>
            <a href="#works" className="hover:text-[#e26947] transition-colors">
              Works
            </a>
            <a href="#about" className="hover:text-[#e26947] transition-colors">
              About
            </a>
            <a
              href="#contact"
              className="hover:text-[#e26947] transition-colors"
            >
              Contact
            </a>
            {siteConfig?.instagram && (
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#e26947] transition-colors"
              >
                Instagram
              </a>
            )}
            {siteConfig?.twitter && (
              <a
                href={siteConfig.twitter}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#e26947] transition-colors"
              >
                Twitter
              </a>
            )}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[#d89b52] hover:text-[#e26947] transition-colors"
            >
              <SlidersHorizontal strokeWidth={1.35} className="w-3.5 h-3.5" />
              <span>Darkroom CMS</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
