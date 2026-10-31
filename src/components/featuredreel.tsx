"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { TiltPlate } from "./magnetic";
import { normalizeFilmTint } from "./reactivebackground";
import type { PhotoItem } from "./photogallery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface FeaturedReelProps {
  photos: PhotoItem[];
  onSelectPhoto: (photo: PhotoItem, triggerEl?: HTMLElement | null) => void;
  onAmbientColorChange: (color: string) => void;
}

export default function FeaturedReel({
  photos,
  onSelectPhoto,
  onAmbientColorChange,
}: FeaturedReelProps) {
  const featuredCandidates = photos.filter((p) => p.isFeatured);
  const reelPhotos =
    featuredCandidates.length >= 3 ? featuredCandidates : photos.slice(0, 4);

  const sectionRef = useRef<HTMLElement | null>(null);
  const pinStageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reelProgressRef = useRef<HTMLDivElement | null>(null);
  const lastIndexRef = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      const pinStage = pinStageRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!pinStage || !viewport || !track || reelPhotos.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const getDistance = () => {
            const dist = track.scrollWidth - viewport.clientWidth;
            return Math.max(0, dist);
          };

          const tween = gsap.to(track, {
            x: () => -getDistance(),
            ease: "none",
            scrollTrigger: {
              trigger: pinStage,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              start: "top top",
              end: () =>
                `+=${Math.max(window.innerHeight * 1.35, getDistance() * 1.05)}`,
              onEnter: () => {
                const current = reelPhotos[lastIndexRef.current] || reelPhotos[0];
                if (current?.dominantColor) {
                  onAmbientColorChange(current.dominantColor);
                }
              },
              onEnterBack: () => {
                const current =
                  reelPhotos[lastIndexRef.current] ||
                  reelPhotos[reelPhotos.length - 1];
                if (current?.dominantColor) {
                  onAmbientColorChange(current.dominantColor);
                }
              },
              onUpdate: (self) => {
                if (reelProgressRef.current) {
                  reelProgressRef.current.style.transform = `scaleX(${self.progress.toFixed(
                    4
                  )})`;
                }
                const nextIdx = Math.min(
                  reelPhotos.length - 1,
                  Math.max(0, Math.round(self.progress * (reelPhotos.length - 1)))
                );
                if (nextIdx !== lastIndexRef.current) {
                  lastIndexRef.current = nextIdx;
                  setActiveIndex(nextIdx);
                  const activePhoto = reelPhotos[nextIdx];
                  if (activePhoto?.dominantColor) {
                    onAmbientColorChange(activePhoto.dominantColor);
                  }
                }
              },
            },
          });

          return () => {
            tween.kill();
            gsap.set(track, { clearProps: "transform" });
          };
        }
      );

      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        gsap.set(track, { clearProps: "transform" });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [reelPhotos.length] }
  );

  const handleMobileScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0 || reelPhotos.length === 0) return;

      const progress = Math.max(0, Math.min(1, container.scrollLeft / maxScroll));
      if (reelProgressRef.current) {
        reelProgressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }

      const nextIdx = Math.min(
        reelPhotos.length - 1,
        Math.max(0, Math.round(progress * (reelPhotos.length - 1)))
      );
      if (nextIdx !== lastIndexRef.current) {
        lastIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
        const activePhoto = reelPhotos[nextIdx];
        if (activePhoto?.dominantColor) {
          onAmbientColorChange(activePhoto.dominantColor);
        }
      }
    },
    [reelPhotos, onAmbientColorChange]
  );

  if (reelPhotos.length === 0) return null;

  const boundedActive = Math.min(activeIndex, reelPhotos.length - 1);
  const currentPlate = reelPhotos[boundedActive] || reelPhotos[0];
  const currentTint = normalizeFilmTint(currentPlate?.dominantColor);

  return (
    <section
      id="reel"
      ref={sectionRef}
      aria-label="Featured medium-format film reel"
      className="relative w-full scroll-mt-16"
    >
      <div className="chromatic-divider" aria-hidden="true" />

      <div
        ref={pinStageRef}
        className="relative w-full md:min-h-[100dvh] flex flex-col justify-center py-20 md:py-0 overflow-hidden"
      >
        {/* Ambient reel halation wash synced to active cinema plate */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 transition-colors duration-700"
          style={{
            background: `radial-gradient(ellipse 64% 52% at 50% 52%, color-mix(in oklab, ${currentTint} 20%, transparent), transparent 72%)`,
          }}
          aria-hidden="true"
        />

        {/* Top Contact-Strip Header & Plate Counter */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-7 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-[#1c1613] border border-[#3a3029] text-[#d89b52]">
                <span
                  className="color-swatch-chip w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentTint }}
                  aria-hidden="true"
                />
                120 Color Negative Contact Reel
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-[#f4ede2] tracking-tight leading-[1.08]">
                Featured plates{" "}
                <span className="italic text-[#d89b52]">in sequence</span>
              </h2>
            </div>

            <div className="flex items-center gap-5">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#a39686] tabular-nums">
                <span className="text-[#f4ede2] font-medium">
                  {String(boundedActive + 1).padStart(2, "0")}
                </span>{" "}
                <span className="text-[#5d4e42]">/</span>{" "}
                <span>{String(reelPhotos.length).padStart(2, "0")}</span>
              </div>

              <div className="hidden sm:block w-36 h-[3px] rounded-full bg-[#27201b] overflow-hidden" aria-hidden="true">
                <div
                  ref={reelProgressRef}
                  className="h-full w-full origin-left transition-transform duration-150 ease-out"
                  style={{
                    transform: "scaleX(0)",
                    background:
                      "linear-gradient(90deg, #e26947 0%, #d89b52 55%, #3b7a8c 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Cinema Viewport (GSAP pinned on desktop, native snap strip on mobile & reduced-motion) */}
        <div
          ref={viewportRef}
          onScroll={handleMobileScroll}
          data-cursor="REEL"
          className="w-full overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={trackRef}
            className="flex items-stretch gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-8 lg:px-[max(3rem,calc((100vw-80rem)/2+3rem))] w-max pb-4 md:pb-0"
          >
            {reelPhotos.map((photo, idx) => {
              const plateTint = normalizeFilmTint(photo.dominantColor);
              const cameraLine = [photo.exifCamera, photo.exifLens]
                .filter(Boolean)
                .join(" · ");
              const exposureLine = [
                photo.exifAperture,
                photo.exifShutterSpeed,
                photo.exifIso ? `ISO ${photo.exifIso}` : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <article
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open featured plate ${idx + 1} of ${reelPhotos.length}: ${photo.title}`}
                  data-cursor="VIEW"
                  onClick={(e) => onSelectPhoto(photo, e.currentTarget)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPhoto(photo, e.currentTarget);
                    }
                  }}
                  onMouseEnter={() => {
                    if (photo.dominantColor) {
                      onAmbientColorChange(photo.dominantColor);
                    }
                  }}
                  onFocus={() => {
                    if (photo.dominantColor) {
                      onAmbientColorChange(photo.dominantColor);
                    }
                  }}
                  className="group relative w-[86vw] sm:w-[74vw] md:w-[60vw] lg:w-[50vw] max-w-[760px] shrink-0 snap-center focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-6 rounded-2xl"
                >
                  {/* Per-frame chromatic halation aura */}
                  <div
                    className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-55 group-hover:opacity-90 transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{
                      background: `radial-gradient(circle at 50% 48%, color-mix(in oklab, ${plateTint} 28%, transparent), transparent 72%)`,
                    }}
                    aria-hidden="true"
                  />

                  {/* Double-Bezel Cinema Frame with 3D Pointer Tilt + Specular Glare */}
                  <div className="double-bezel-shell p-1.5 sm:p-2 rounded-[1.5rem]">
                    <TiltPlate
                      tint={plateTint}
                      maxTilt={4}
                      className="rounded-[calc(1.5rem-0.375rem)] p-2.5 sm:p-3.5"
                    >
                      {/* Top Analog Film Rebate Edge Code */}
                      <div className="mb-2.5 px-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#a39686] tabular-nums">
                        <span>
                          KODAK PORTRA · {String(idx + 1).padStart(2, "0")}A
                        </span>
                        <span className="text-[#d89b52]">
                          {photo.category?.name || "Monograph"}
                        </span>
                      </div>

                      {/* Cinema 16:10 Image Window */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#0d0a09]">
                        <Image
                          src={photo.url}
                          alt={
                            photo.description
                              ? `${photo.title}. ${photo.description}`
                              : photo.title
                          }
                          fill
                          sizes="(max-width: 768px) 86vw, 52vw"
                          loading={idx === 0 ? "eager" : "lazy"}
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.035]"
                        />
                      </div>

                      {/* Bottom Plate Metadata & Optical Readout */}
                      <div className="mt-3.5 px-1 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
                        <div className="min-w-0">
                          <h3 className="font-serif text-xl sm:text-2xl md:text-[1.65rem] text-[#f4ede2] group-hover:text-[#e26947] transition-colors duration-300 leading-tight truncate">
                            {photo.title}
                          </h3>
                          {photo.description && (
                            <p className="mt-1 text-xs sm:text-sm text-[#c6baa9] line-clamp-1">
                              {photo.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-left sm:text-right font-mono text-[10px] text-[#a39686] tabular-nums leading-relaxed">
                            <div>{cameraLine || "Medium-format 120"}</div>
                            {exposureLine && (
                              <div className="text-[#c6baa9]">{exposureLine}</div>
                            )}
                          </div>

                          <span className="w-8 h-8 rounded-full bg-[#241d18] border border-[#3f342c] group-hover:border-[#e26947] group-hover:bg-[#e26947] text-[#f4ede2] group-hover:text-[#110e0c] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <ArrowUpRight strokeWidth={1.35} className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </TiltPlate>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
