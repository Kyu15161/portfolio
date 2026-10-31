"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useColorTheme, normalizeFilmTint } from "./reactivebackground";
import { Magnetic, TiltPlate } from "./magnetic";
import { X, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export interface PhotoItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  dominantColor?: string | null;
  order: number;
  isFeatured: boolean;
  isHidden: boolean;
  exifCamera?: string | null;
  exifLens?: string | null;
  exifFocalLength?: string | null;
  exifAperture?: string | null;
  exifShutterSpeed?: string | null;
  exifIso?: string | null;
  category?: { id: string; name: string; slug: string } | null;
}

interface PhotoGalleryProps {
  photos: PhotoItem[];
  allPhotos?: PhotoItem[];
  categories?: { id: string; name: string; slug: string }[];
  activeCategory?: string;
  onSelectCategory?: (slug: string) => void;
  externalOpenPhoto?: PhotoItem | null;
  externalTriggerEl?: HTMLElement | null;
  onExternalClose?: () => void;
}

function getSpreadLayout(
  index: number,
  total: number
): {
  colClass: string;
  aspectClass: string;
  sizes: string;
} {
  if (total === 1) {
    return {
      colClass: "md:col-span-12",
      aspectClass: "aspect-[16/9]",
      sizes: "(max-width: 768px) 100vw, 90vw",
    };
  }

  // Final odd item spans all 12 columns so every row sums to 12 with zero dead cells
  if (total % 2 === 1 && index === total - 1) {
    return {
      colClass: "md:col-span-12",
      aspectClass: "aspect-[16/9] sm:aspect-[21/10]",
      sizes: "(max-width: 768px) 100vw, 90vw",
    };
  }

  const slot = index % 6;
  switch (slot) {
    case 0:
      return {
        colClass: "md:col-span-7",
        aspectClass: "aspect-[16/10]",
        sizes: "(max-width: 768px) 100vw, 58vw",
      };
    case 1:
      return {
        colClass: "md:col-span-5",
        aspectClass: "aspect-[4/5]",
        sizes: "(max-width: 768px) 100vw, 42vw",
      };
    case 2:
      return {
        colClass: "md:col-span-5",
        aspectClass: "aspect-[4/5]",
        sizes: "(max-width: 768px) 100vw, 42vw",
      };
    case 3:
      return {
        colClass: "md:col-span-7",
        aspectClass: "aspect-[3/2]",
        sizes: "(max-width: 768px) 100vw, 58vw",
      };
    case 4:
      return {
        colClass: "md:col-span-8",
        aspectClass: "aspect-[16/10]",
        sizes: "(max-width: 768px) 100vw, 66vw",
      };
    default:
      return {
        colClass: "md:col-span-4",
        aspectClass: "aspect-[3/4]",
        sizes: "(max-width: 768px) 100vw, 34vw",
      };
  }
}

export default function PhotoGallery({
  photos,
  allPhotos,
  categories = [],
  activeCategory = "all",
  onSelectCategory,
  externalOpenPhoto = null,
  externalTriggerEl = null,
  onExternalClose,
}: PhotoGalleryProps) {
  const { setCurrentColor } = useColorTheme();
  const [internalSelectedPhoto, setInternalSelectedPhoto] =
    useState<PhotoItem | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedColor, setCopiedColor] = useState(false);

  const sectionScopeRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const worksHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const lightboxHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const thumbStripRef = useRef<HTMLDivElement | null>(null);

  const selectedPhoto = externalOpenPhoto ?? internalSelectedPhoto;

  // Determine the Lightbox navigation pool so external photos from Hero/Reel are always included
  const lightboxPhotos = React.useMemo(() => {
    if (!selectedPhoto) return photos;
    if (photos.some((p) => p.id === selectedPhoto.id)) return photos;
    if (allPhotos && allPhotos.some((p) => p.id === selectedPhoto.id)) {
      return allPhotos;
    }
    return [selectedPhoto, ...photos];
  }, [selectedPhoto, photos, allPhotos]);

  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);
  const activeHeading =
    activeCategory === "all"
      ? "Selected works"
      : activeCategoryObj?.name || "Selected works";

  // Category switch wrapped in View Transitions API + flushSync + focus safety
  const handleCategoryTransition = useCallback(
    (nextSlug: string, routeFocusToHeading = false) => {
      if (!onSelectCategory || nextSlug === activeCategory) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      const ensureFocusSafety = () => {
        if (
          routeFocusToHeading ||
          !document.activeElement ||
          document.activeElement === document.body ||
          !document.contains(document.activeElement)
        ) {
          worksHeadingRef.current?.focus({ preventScroll: true });
        }
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      };

      if (
        !prefersReducedMotion &&
        typeof docWithVT.startViewTransition === "function"
      ) {
        gridRef.current?.classList.add("gallery-vt-active");
        const vt = docWithVT.startViewTransition(() => {
          flushSync(() => {
            onSelectCategory(nextSlug);
          });
        });
        vt.finished.finally(() => {
          gridRef.current?.classList.remove("gallery-vt-active");
          ensureFocusSafety();
        });
      } else {
        onSelectCategory(nextSlug);
        requestAnimationFrame(() => {
          ensureFocusSafety();
        });
      }
    },
    [activeCategory, onSelectCategory]
  );

  // GSAP ScrollTrigger scale-in reveals, caption parallax, and scroll-synced color grading
  useGSAP(
    () => {
      const scopeEl = sectionScopeRef.current;
      if (!scopeEl || photos.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(
          ".gallery-card-item",
          scopeEl
        );

        cards.forEach((card) => {
          const plateWrap = card.querySelector<HTMLElement>(
            ".gallery-plate-entry"
          );
          const captionWrap =
            card.querySelector<HTMLElement>(".gallery-caption");
          const plateColor = card.getAttribute("data-dominant-color");

          if (plateWrap) {
            gsap.fromTo(
              plateWrap,
              { opacity: 0, y: 28, scale: 0.96 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 88%",
                  once: true,
                },
              }
            );
          }

          if (captionWrap) {
            gsap.fromTo(
              captionWrap,
              { y: 10 },
              {
                y: -6,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              }
            );
          }

          if (plateColor) {
            ScrollTrigger.create({
              trigger: card,
              start: "top 58%",
              end: "bottom 42%",
              onEnter: () => setCurrentColor(plateColor),
              onEnterBack: () => setCurrentColor(plateColor),
            });
          }
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(
          ".gallery-card-item",
          scopeEl
        );
        cards.forEach((card) => {
          const plateWrap = card.querySelector<HTMLElement>(
            ".gallery-plate-entry"
          );
          const captionWrap =
            card.querySelector<HTMLElement>(".gallery-caption");
          if (plateWrap) {
            gsap.set(plateWrap, { clearProps: "all" });
          }
          if (captionWrap) {
            gsap.set(captionWrap, { clearProps: "all" });
          }
        });
      });

      return () => {
        mm.revert();
      };
    },
    {
      scope: sectionScopeRef,
      dependencies: [activeCategory, photos.length],
    }
  );

  // Reduced-motion IntersectionObserver ambient color sync without scroll motion
  useEffect(() => {
    if (typeof window === "undefined" || photos.length === 0) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scopeEl = sectionScopeRef.current;
    if (!scopeEl) return;
    const cards = Array.from(
      scopeEl.querySelectorAll<HTMLElement>(".gallery-card-item")
    );
    if (cards.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const color = entry.target.getAttribute("data-dominant-color");
            if (color) {
              setCurrentColor(color);
            }
          }
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0.1 }
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [activeCategory, photos.length, setCurrentColor]);

  const closeLightbox = useCallback(() => {
    const restoreTarget = lastTriggerRef.current || externalTriggerEl;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };

    const applyClose = () => {
      flushSync(() => {
        setInternalSelectedPhoto(null);
        setIsZoomed(false);
        onExternalClose?.();
      });
    };

    if (
      !prefersReducedMotion &&
      typeof docWithVT.startViewTransition === "function"
    ) {
      const vt = docWithVT.startViewTransition(applyClose);
      vt.finished.finally(() => {
        restoreTarget?.focus();
      });
    } else {
      applyClose();
      requestAnimationFrame(() => {
        restoreTarget?.focus();
      });
    }
  }, [onExternalClose, externalTriggerEl]);

  const openLightbox = useCallback(
    (photo: PhotoItem, triggerEl?: HTMLElement | null) => {
      if (triggerEl) {
        lastTriggerRef.current = triggerEl;
      }
      window.dispatchEvent(new Event("portfolio:shutter"));
      if (photo.dominantColor) {
        setCurrentColor(photo.dominantColor);
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      const applyOpen = () => {
        flushSync(() => {
          onExternalClose?.();
          setInternalSelectedPhoto(photo);
          setIsZoomed(false);
        });
      };

      if (
        !prefersReducedMotion &&
        typeof docWithVT.startViewTransition === "function"
      ) {
        const vt = docWithVT.startViewTransition(applyOpen);
        vt.finished.finally(() => {
          lightboxHeadingRef.current?.focus();
        });
      } else {
        applyOpen();
        requestAnimationFrame(() => {
          lightboxHeadingRef.current?.focus();
        });
      }
    },
    [onExternalClose, setCurrentColor]
  );

  // Route focus when opened externally from Hero, Reel, or About plate
  useEffect(() => {
    if (externalOpenPhoto) {
      if (externalTriggerEl) {
        lastTriggerRef.current = externalTriggerEl;
      }
      requestAnimationFrame(() => {
        lightboxHeadingRef.current?.focus();
      });
    }
  }, [externalOpenPhoto, externalTriggerEl]);

  const selectedIndex = selectedPhoto
    ? lightboxPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  // Keep active thumbnail centered inside the Lightbox filmstrip
  useEffect(() => {
    if (!selectedPhoto || !thumbStripRef.current) return;
    const activeBtn = thumbStripRef.current.querySelector<HTMLElement>(
      `[data-thumb-id="${selectedPhoto.id}"]`
    );
    if (!activeBtn) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    activeBtn.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedPhoto]);

  const activateNeighborPhoto = useCallback(
    (nextPhoto: PhotoItem) => {
      onExternalClose?.();
      setInternalSelectedPhoto(nextPhoto);
      setIsZoomed(false);
      if (nextPhoto.dominantColor) {
        setCurrentColor(nextPhoto.dominantColor);
      }
    },
    [onExternalClose, setCurrentColor]
  );

  const handlePrevPhoto = useCallback(() => {
    if (lightboxPhotos.length === 0) return;
    if (selectedIndex > 0) {
      activateNeighborPhoto(lightboxPhotos[selectedIndex - 1]);
    } else if (selectedIndex === 0 && lightboxPhotos.length > 1) {
      activateNeighborPhoto(lightboxPhotos[lightboxPhotos.length - 1]);
    } else if (selectedIndex === -1) {
      activateNeighborPhoto(lightboxPhotos[0]);
    }
  }, [selectedIndex, lightboxPhotos, activateNeighborPhoto]);

  const handleNextPhoto = useCallback(() => {
    if (lightboxPhotos.length === 0) return;
    if (selectedIndex >= 0 && selectedIndex < lightboxPhotos.length - 1) {
      activateNeighborPhoto(lightboxPhotos[selectedIndex + 1]);
    } else if (
      selectedIndex === lightboxPhotos.length - 1 &&
      lightboxPhotos.length > 1
    ) {
      activateNeighborPhoto(lightboxPhotos[0]);
    } else if (selectedIndex === -1) {
      activateNeighborPhoto(lightboxPhotos[0]);
    }
  }, [selectedIndex, lightboxPhotos, activateNeighborPhoto]);

  const handleCopyColor = (colorHex: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(colorHex).then(() => {
      setCopiedColor(true);
      setTimeout(() => setCopiedColor(false), 2000);
    });
  };

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      } else if (e.key === "ArrowRight") {
        handleNextPhoto();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto, closeLightbox, handlePrevPhoto, handleNextPhoto]);

  const exifSpecs = selectedPhoto
    ? [
        { label: "Camera", value: selectedPhoto.exifCamera },
        { label: "Optics", value: selectedPhoto.exifLens },
        { label: "Aperture", value: selectedPhoto.exifAperture },
        {
          label: "Exposure",
          value: [
            selectedPhoto.exifShutterSpeed,
            selectedPhoto.exifIso ? `ISO ${selectedPhoto.exifIso}` : null,
          ]
            .filter(Boolean)
            .join(", "),
        },
      ].filter((item) => Boolean(item.value))
    : [];

  return (
    <div ref={sectionScopeRef} className="w-full">
      {/* Monograph Chapter Header & Magnetic Category Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-12 md:mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] bg-[#1c1613] border border-[#3a3029] text-[#e26947]">
              Monograph Index
            </span>
            <h2
              id="works-heading"
              ref={worksHeadingRef}
              tabIndex={-1}
              className="mt-3 font-serif text-4xl sm:text-5xl text-[#f4ede2] tracking-tight leading-[1.06] focus:outline-none"
            >
              {activeHeading}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {categories.length > 0 && onSelectCategory && (
              <div
                role="group"
                aria-label="Filter works by series"
                className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-[#181310] border border-[#342b24]"
              >
                <Magnetic strength={0.22} maxShift={6}>
                  <button
                    type="button"
                    aria-pressed={activeCategory === "all"}
                    onClick={() => handleCategoryTransition("all", false)}
                    className={`px-4 py-1.5 text-xs rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2 ${
                      activeCategory === "all"
                        ? "bg-[#e26947] text-[#110e0c] font-semibold shadow-sm"
                        : "text-[#c6baa9] hover:text-[#f4ede2] hover:bg-[#261f1a]"
                    }`}
                  >
                    All works
                  </button>
                </Magnetic>

                {categories.map((c) => {
                  const isActive = activeCategory === c.slug;
                  return (
                    <Magnetic key={c.id} strength={0.22} maxShift={6}>
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleCategoryTransition(c.slug, false)}
                        className={`px-4 py-1.5 text-xs rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-2 ${
                          isActive
                            ? "bg-[#e26947] text-[#110e0c] font-semibold shadow-sm"
                            : "text-[#c6baa9] hover:text-[#f4ede2] hover:bg-[#261f1a]"
                        }`}
                      >
                        {c.name}
                      </button>
                    </Magnetic>
                  );
                })}
              </div>
            )}

            <p
              aria-live="polite"
              className="font-mono text-xs text-[#a39686] tabular-nums shrink-0"
            >
              {photos.length} {photos.length === 1 ? "plate" : "plates"}
            </p>
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="max-w-lg mx-auto my-16 double-bezel-shell p-2 rounded-[2rem]">
          <div className="double-bezel-core rounded-[calc(2rem-0.5rem)] p-8 text-center">
            <p className="font-serif text-2xl text-[#f4ede2]">
              No plates filed in this series yet
            </p>
            <p className="mt-2 text-sm text-[#c6baa9] leading-relaxed">
              Choose another chapter above or return to the full archive.
            </p>
            {activeCategory !== "all" && onSelectCategory && (
              <button
                type="button"
                onClick={() => handleCategoryTransition("all", true)}
                className="mt-5 px-5 py-2 rounded-full bg-[#e26947] text-[#110e0c] text-xs font-semibold cursor-pointer active:scale-[0.98]"
              >
                Show all works
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-12 grid-flow-dense gap-y-16 md:gap-x-8 lg:gap-x-10 md:gap-y-24 items-start w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12"
        >
          {photos.map((photo, index) => {
            const { colClass, aspectClass, sizes } = getSpreadLayout(
              index,
              photos.length
            );
            const cardTint = normalizeFilmTint(photo.dominantColor);
            const cameraSummary = [photo.exifCamera, photo.exifAperture]
              .filter(Boolean)
              .join(" · ");
            const vtStyle =
              index < 6
                ? ({
                    "--vt-plate-name": `plate-${photo.id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
                  } as React.CSSProperties)
                : undefined;

            return (
              <article
                key={photo.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect photograph: ${photo.title}`}
                data-dominant-color={photo.dominantColor || "#e26947"}
                data-vt-plate={index < 6 ? "true" : undefined}
                style={vtStyle}
                className={`gallery-card-item group relative flex flex-col w-full ${colClass} focus-visible:outline-2 focus-visible:outline-[#e26947] focus-visible:outline-offset-6 rounded-2xl`}
                onMouseEnter={() => {
                  if (photo.dominantColor) {
                    setCurrentColor(photo.dominantColor);
                  }
                }}
                onFocus={() => {
                  if (photo.dominantColor) {
                    setCurrentColor(photo.dominantColor);
                  }
                }}
                onClick={(e) => openLightbox(photo, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(photo, e.currentTarget);
                  }
                }}
                data-cursor="VIEW"
              >
                {/* Double-Bezel Machined Darkroom Print Tray + 3D Tilt + Glare */}
                <div className="gallery-plate-entry double-bezel-shell p-1.5 sm:p-2 rounded-[1.5rem]">
                  <TiltPlate
                    tint={cardTint}
                    maxTilt={4.5}
                    className="rounded-[calc(1.5rem-0.375rem)] p-2.5 sm:p-3.5"
                  >
                    <div
                      className={`relative ${aspectClass} w-full overflow-hidden rounded-lg bg-[#0e0b0a]`}
                    >
                      <Image
                        src={photo.url}
                        alt={
                          photo.description
                            ? `${photo.title}. ${photo.description}`
                            : photo.title
                        }
                        fill
                        sizes={sizes}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.035]"
                        loading={index < 2 ? "eager" : "lazy"}
                      />
                    </div>
                  </TiltPlate>
                </div>

                {/* Editorial Caption Strip with Subtle Scroll Parallax */}
                <div className="gallery-caption mt-4 px-1 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#f4ede2] group-hover:text-[#e26947] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] tracking-tight leading-snug">
                      {photo.title}
                    </h3>
                    <span className="font-mono text-[11px] tabular-nums text-[#a39686] shrink-0">
                      PLATE {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {photo.description && (
                    <p className="text-sm text-[#c6baa9] leading-relaxed max-w-[62ch]">
                      {photo.description}
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] font-mono text-[#a39686] tabular-nums">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="color-swatch-chip w-2.5 h-2.5 rounded-full border border-[#f4ede2]/25 shrink-0"
                        style={{
                          backgroundColor: photo.dominantColor || cardTint,
                        }}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {cameraSummary || photo.category?.name || "Archive print"}
                      </span>
                    </div>

                    {photo.category?.name && (
                      <span className="text-[#d89b52] shrink-0">
                        {photo.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Chromatic Darkroom Lightbox with Filmstrip */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-photo-title"
          className="fixed inset-0 z-50 lightbox-backdrop backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 overflow-y-auto"
          style={
            {
              "--lightbox-tint": normalizeFilmTint(selectedPhoto.dominantColor),
            } as React.CSSProperties
          }
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-[#c6baa9] text-xs border-b border-[#382e27] pb-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-[#f4ede2]">
                {selectedPhoto.category?.name || "Archive"}
              </span>
              {selectedIndex >= 0 && (
                <>
                  <span className="text-[#594b40]">·</span>
                  <span>
                    {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                    {String(lightboxPhotos.length).padStart(2, "0")}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline font-mono text-[11px] text-[#a39686]">
                Arrow keys to step · Esc to close
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1e1815] hover:bg-[#2a221d] border border-[#43372f] text-[#f4ede2] rounded-full text-xs transition-colors cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947]"
                aria-label="Close lightbox"
              >
                <X strokeWidth={1.35} className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Main Inspection Stage */}
          <div
            className="relative max-w-6xl w-full my-3 flex flex-col lg:flex-row items-stretch gap-6 md:gap-8 bg-[#16120f]/95 border border-[#382e27] p-4 sm:p-6 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-[38%] lg:top-1/2 -translate-y-1/2 z-30 p-2.5 bg-[#1b1613]/92 hover:bg-[#28201b] border border-[#43372f] hover:border-[#e26947] text-[#f4ede2] rounded-full transition-all shadow-xl cursor-pointer active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#e26947]"
                  title="Previous photograph (Left Arrow)"
                  aria-label="Previous photograph"
                >
                  <ChevronLeft strokeWidth={1.35} className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-[38%] lg:top-1/2 -translate-y-1/2 z-30 p-2.5 bg-[#1b1613]/92 hover:bg-[#28201b] border border-[#43372f] hover:border-[#e26947] text-[#f4ede2] rounded-full transition-all shadow-xl cursor-pointer active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#e26947]"
                  title="Next photograph (Right Arrow)"
                  aria-label="Next photograph"
                >
                  <ChevronRight strokeWidth={1.35} className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Optical Loupe Viewport */}
            <div className="w-full lg:w-2/3 flex flex-col gap-2">
              <div
                className={`relative w-full h-[38dvh] sm:h-[46dvh] lg:h-[56dvh] rounded-xl overflow-hidden bg-[#0d0a09] select-none border border-[#2d251f] ${
                  isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed((prev) => !prev)}
                data-cursor={isZoomed ? "100%" : "150%"}
                title={
                  isZoomed
                    ? "Reset magnification to 100%"
                    : "Magnify to 150%"
                }
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center ${
                    isZoomed ? "scale-150" : "scale-100"
                  }`}
                >
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    fill
                    sizes="(max-width: 1024px) 95vw, 65vw"
                    loading="eager"
                    className="object-contain pointer-events-none select-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#a39686] px-0.5">
                <span>
                  {isZoomed
                    ? "150% loupe view (click plate to reset)"
                    : "100% full frame (click plate to magnify)"}
                </span>
                {selectedPhoto.isFeatured && (
                  <span className="text-[#d89b52]">Monograph selection</span>
                )}
              </div>
            </div>

            {/* Print Notes & Camera Readout */}
            <div className="w-full lg:w-1/3 flex flex-col justify-between text-[#c6baa9]">
              <div>
                <h2
                  id="lightbox-photo-title"
                  ref={lightboxHeadingRef}
                  tabIndex={-1}
                  className="font-serif text-2xl sm:text-3xl text-[#f4ede2] tracking-tight leading-snug focus:outline-none"
                >
                  {selectedPhoto.title}
                </h2>

                {selectedPhoto.description && (
                  <p className="text-sm text-[#c6baa9] mt-3 leading-relaxed">
                    {selectedPhoto.description}
                  </p>
                )}

                {exifSpecs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5 mt-6">
                    {exifSpecs.map((spec) => (
                      <div
                        key={spec.label}
                        className="p-3 rounded-xl bg-[#1d1714] border border-[#332a23]"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#a39686]">
                          {spec.label}
                        </div>
                        <div className="mt-1 font-mono text-xs text-[#f4ede2] tabular-nums">
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPhoto.dominantColor && (
                <div className="mt-6 pt-5 border-t border-[#332a23] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="color-swatch-chip w-6 h-6 rounded-full border border-[#f4ede2]/25 shadow-sm"
                      style={{ backgroundColor: selectedPhoto.dominantColor }}
                    />
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#a39686]">
                        Dominant pigment
                      </div>
                      <div className="font-mono text-xs text-[#f4ede2] tabular-nums">
                        {selectedPhoto.dominantColor}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyColor(selectedPhoto.dominantColor!)}
                    data-cursor={copiedColor ? "COPIED" : "COPY"}
                    className="px-3.5 py-1.5 bg-[#241d19] hover:bg-[#302620] text-[#f4ede2] border border-[#43372f] rounded-full flex items-center gap-1.5 text-xs font-mono transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#e26947]"
                    title="Copy hex color"
                  >
                    {copiedColor ? (
                      <>
                        <Check
                          strokeWidth={1.35}
                          className="w-3.5 h-3.5 text-[#a9d896]"
                        />
                        <span className="text-[#a9d896]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy
                          strokeWidth={1.35}
                          className="w-3.5 h-3.5 text-[#c6baa9]"
                        />
                        <span>Copy hex</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Contact-Sheet Thumbnail Strip */}
          {lightboxPhotos.length > 1 && (
            <div
              ref={thumbStripRef}
              onClick={(e) => e.stopPropagation()}
              aria-label="Lightbox filmstrip"
              className="w-full max-w-6xl flex items-center gap-2.5 overflow-x-auto py-1.5 px-1 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {lightboxPhotos.map((thumb, idx) => {
                const isCurrent = thumb.id === selectedPhoto.id;
                return (
                  <button
                    key={thumb.id}
                    type="button"
                    data-thumb-id={thumb.id}
                    onClick={() => activateNeighborPhoto(thumb)}
                    aria-label={`View plate ${idx + 1}: ${thumb.title}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`relative w-16 sm:w-20 aspect-[16/10] rounded-md overflow-hidden shrink-0 border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e26947] ${
                      isCurrent
                        ? "border-[#e26947] ring-2 ring-[#e26947]/45 opacity-100 scale-105"
                        : "border-[#382e27] opacity-55 hover:opacity-90"
                    }`}
                  >
                    <Image
                      src={thumb.url}
                      alt=""
                      fill
                      sizes="80px"
                      loading="lazy"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
