import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import ReactiveBackground from "@/components/reactivebackground";
import CustomCursor from "@/components/customcursor";
import CameraPreloader from "@/components/camerapreloader";
import ShutterTransition from "@/components/shuttertransition";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-ui",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-tech",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maren Lindqvist | Photographs & Print Archive",
  description:
    "Medium-format color and architectural photographs from northern ports, twilight streets, and coastal landscapes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${cormorant.variable} ${plusJakarta.variable} ${ibmPlexMono.variable} bg-[#110e0c] text-[#f4ede2] antialiased selection:bg-[#e26947] selection:text-[#110e0c]`}
    >
      <body
        suppressHydrationWarning
        className="min-h-[100dvh] bg-[#110e0c] text-[#f4ede2] font-sans"
      >
        <CameraPreloader />
        <ShutterTransition />
        <CustomCursor />
        <ReactiveBackground>{children}</ReactiveBackground>
      </body>
    </html>
  );
}
