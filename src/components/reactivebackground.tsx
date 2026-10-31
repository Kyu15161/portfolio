"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import WebGLBackground from "./webglbackground";

interface ColorContextType {
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

const DEFAULT_AMBIENT_COLOR = "#e26947";

export function normalizeFilmTint(
  hex?: string | null,
  fallback = DEFAULT_AMBIENT_COLOR
): string {
  if (!hex || typeof hex !== "string") return fallback;
  const trimmed = hex.trim();
  if (!trimmed.startsWith("#")) return fallback;
  const raw = trimmed.slice(1);
  let r = 226;
  let g = 105;
  let b = 71;

  if (raw.length === 3) {
    r = parseInt(raw[0] + raw[0], 16);
    g = parseInt(raw[1] + raw[1], 16);
    b = parseInt(raw[2] + raw[2], 16);
  } else if (raw.length === 6) {
    r = parseInt(raw.slice(0, 2), 16);
    g = parseInt(raw.slice(2, 4), 16);
    b = parseInt(raw.slice(4, 6), 16);
  } else {
    return fallback;
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return fallback;
  }

  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luma < 0.1) {
    return "#c97a42";
  }

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const ColorContext = createContext<ColorContextType>({
  currentColor: DEFAULT_AMBIENT_COLOR,
  setCurrentColor: () => {},
});

export const useColorTheme = () => useContext(ColorContext);

const FILM_GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E";

export default function ReactiveBackground({ children }: { children: ReactNode }) {
  const [currentColor, setRawColor] = useState(DEFAULT_AMBIENT_COLOR);

  const setCurrentColor = useCallback((nextColor: string) => {
    const normalized = normalizeFilmTint(nextColor);
    setRawColor((prev) => (prev === normalized ? prev : normalized));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--ambient-color", currentColor);
  }, [currentColor]);

  return (
    <ColorContext.Provider value={{ currentColor, setCurrentColor }}>
      <WebGLBackground currentColor={currentColor} />
      {/* Fixed, non-scrolling analog fiber-paper grain layer */}
      <div
        className="fixed inset-0 z-30 pointer-events-none opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage: `url("${FILM_GRAIN_SVG}")`,
          backgroundSize: "180px 180px",
        }}
        aria-hidden="true"
      />
      {children}
    </ColorContext.Provider>
  );
}
