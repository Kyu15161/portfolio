"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Eye,
  EyeOff,
  Star,
  Trash2,
  GripVertical,
  LogOut,
  ExternalLink,
  Save,
  Plus,
  Settings,
  Image as ImageIcon,
  Sliders,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  order?: number;
}

export interface AdminPhoto {
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
  categoryId?: string | null;
  category?: AdminCategory | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdminSiteConfig {
  id?: string;
  title?: string;
  tagline?: string;
  aboutText?: string;
  email?: string;
  instagram?: string | null;
  twitter?: string | null;
}

interface AdminDashboardProps {
  initialPhotos: AdminPhoto[];
  categories: AdminCategory[];
  siteConfig: AdminSiteConfig;
}

interface ToastNotification {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
  timestamp: string;
}

export default function AdminDashboardClient({
  initialPhotos,
  categories,
  siteConfig,
}: AdminDashboardProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [config, setConfig] = useState(siteConfig || {});
  const [activeTab, setActiveTab] = useState<"photos" | "upload" | "settings">("photos");

  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "warning" | "info" = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      const now = new Date();
      const timestamp = now.toTimeString().split(" ")[0];
      setToast({
        id,
        message,
        type,
        timestamp,
      });
      setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
      }, 4000);
    },
    []
  );

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [exifCamera, setExifCamera] = useState("Hasselblad 500C/M");
  const [exifLens, setExifLens] = useState("Planar 80mm f/2.8");
  const [exifAperture, setExifAperture] = useState("f/5.6");
  const [exifShutter, setExifShutter] = useState("1/250s");
  const [exifIso, setExifIso] = useState("160");
  const [isUploading, setIsUploading] = useState(false);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleToggleHide = async (id: string) => {
    const target = photos.find((p) => p.id === id);
    const willHide = !target?.isHidden;
    const res = await fetch(`/api/admin/photos/${id}/hide`, { method: "POST" });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isHidden: !p.isHidden } : p))
      );
      showToast(
        willHide ? "Hid plate from public exhibition." : "Restored plate to public exhibition.",
        "info"
      );
    }
  };

  const handleToggleFeature = async (id: string) => {
    const target = photos.find((p) => p.id === id);
    const willFeature = !target?.isFeatured;
    const res = await fetch(`/api/admin/photos/${id}/feature`, { method: "POST" });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
      );
      showToast(
        willFeature ? "Marked plate as monograph selection." : "Removed plate from featured selection.",
        "info"
      );
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Remove this photograph from the studio archive?")) return;
    const res = await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      showToast("Removed photograph from the archive.", "warning");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const draggedItem = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, draggedItem);

    setPhotos(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);

    const items = newPhotos.map((p, idx) => ({ id: p.id, order: idx }));
    const res = await fetch("/api/admin/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (res.ok) {
      showToast("Saved new plate sequence.", "success");
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Select an image scan before uploading.", "warning");
      return;
    }

    setIsUploading(true);
    showToast("Uploading scan and extracting pigment color...", "info");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle || "Untitled plate");
      formData.append("description", uploadDesc);
      formData.append("categoryId", uploadCategory);
      formData.append("exifCamera", exifCamera);
      formData.append("exifLens", exifLens);
      formData.append("exifAperture", exifAperture);
      formData.append("exifShutterSpeed", exifShutter);
      formData.append("exifIso", exifIso);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPhotos([data.photo, ...photos]);
        showToast(`Added "${uploadTitle || "Untitled plate"}" to the archive.`, "success");
        setUploadFile(null);
        setUploadTitle("");
        setUploadDesc("");
        setActiveTab("photos");
      } else {
        showToast(data.error || "Upload failed.", "warning");
      }
    } catch {
      showToast("Network error while uploading image.", "warning");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showToast("Saved studio profile and contact notes.", "success");
      } else {
        showToast("Could not save studio profile.", "warning");
      }
    } catch {
      showToast("Could not save studio profile.", "warning");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#110e0c]/90 text-[#f4ede2] font-sans text-sm pb-20 relative">
      {/* Studio Toast Notification */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 max-w-sm sm:max-w-md w-full px-4 pointer-events-auto"
        >
          <div className="bg-[#1b1613]/96 backdrop-blur-md border border-[#43372f] p-4 rounded-sm shadow-2xl flex items-start justify-between gap-3 relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${
                toast.type === "success"
                  ? "bg-[#8ec07c]"
                  : toast.type === "warning"
                  ? "bg-[#e26947]"
                  : "bg-[#d89b52]"
              }`}
            />
            <div className="pl-2">
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#9e9283] tabular-nums mb-1">
                {toast.type === "success" ? (
                  <CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8ec07c]" />
                ) : toast.type === "warning" ? (
                  <AlertTriangle strokeWidth={1.5} className="w-3.5 h-3.5 text-[#e26947]" />
                ) : (
                  <Info strokeWidth={1.5} className="w-3.5 h-3.5 text-[#d89b52]" />
                )}
                <span>Studio log · {toast.timestamp}</span>
              </div>
              <p className="text-[#f4ede2] text-xs font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-[#9e9283] hover:text-[#f4ede2] transition-colors p-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X strokeWidth={1.5} className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Studio Header Bar */}
      <header className="border-b border-[#312923] darkroom-glass px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between sticky top-0 z-40">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#f4ede2] hover:text-[#e26947] transition-colors"
          >
            <ExternalLink strokeWidth={1.5} className="w-4 h-4 text-[#e26947] shrink-0" />
            <span className="font-serif text-xl tracking-tight">View exhibition</span>
          </Link>
          <span className="text-[#4d4036] hidden sm:inline">/</span>
          <span className="font-mono text-xs text-[#b5aa9a]">
            Print Room & Archive
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <span className="text-xs text-[#9e9283] font-mono">Signed in</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1e1815] border border-[#3d332c] hover:border-[#c84638] hover:text-[#f5c2b8] text-[#bfb3a3] rounded-full transition-colors shrink-0 text-xs font-medium cursor-pointer active:scale-[0.98]"
          >
            <LogOut strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Studio Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
        {/* Summary Cards */}
        <section
          aria-label="Archive summary"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          <div className="bg-[#181411] border border-[#312923] p-4 rounded-sm">
            <div className="flex items-center justify-between text-[#9e9283] text-xs mb-1.5">
              <span>Archived plates</span>
              <ImageIcon strokeWidth={1.5} className="w-4 h-4 text-[#8c7f70]" />
            </div>
            <div className="font-serif text-3xl text-[#f4ede2] tabular-nums">
              {photos.length}
            </div>
          </div>

          <div className="bg-[#181411] border border-[#312923] p-4 rounded-sm">
            <div className="flex items-center justify-between text-[#d89b52] text-xs mb-1.5">
              <span>Featured plates</span>
              <Star strokeWidth={1.5} className="w-4 h-4 text-[#d89b52]" />
            </div>
            <div className="font-serif text-3xl text-[#d89b52] tabular-nums">
              {photos.filter((p) => p.isFeatured).length}
            </div>
          </div>

          <div className="bg-[#181411] border border-[#312923] p-4 rounded-sm">
            <div className="flex items-center justify-between text-[#9e9283] text-xs mb-1.5">
              <span>Series</span>
              <Sliders strokeWidth={1.5} className="w-4 h-4 text-[#8c7f70]" />
            </div>
            <div className="font-serif text-3xl text-[#f4ede2] tabular-nums">
              {categories.length}
            </div>
          </div>

          <div className="bg-[#181411] border border-[#312923] p-4 rounded-sm">
            <div className="flex items-center justify-between text-[#9e9283] text-xs mb-1.5">
              <span>Visible in gallery</span>
              <Eye strokeWidth={1.5} className="w-4 h-4 text-[#8ec07c]" />
            </div>
            <div className="font-serif text-3xl text-[#f4ede2] tabular-nums">
              {photos.filter((p) => !p.isHidden).length}
            </div>
          </div>
        </section>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#312923] pb-4 mb-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
              activeTab === "photos"
                ? "bg-[#e26947] text-[#110e0c] font-semibold"
                : "bg-[#1a1512] border border-[#342b24] text-[#b5aa9a] hover:text-[#f4ede2]"
            }`}
          >
            <ImageIcon strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Plates ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
              activeTab === "upload"
                ? "bg-[#e26947] text-[#110e0c] font-semibold"
                : "bg-[#1a1512] border border-[#342b24] text-[#b5aa9a] hover:text-[#f4ede2]"
            }`}
          >
            <Upload strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Upload scan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
              activeTab === "settings"
                ? "bg-[#e26947] text-[#110e0c] font-semibold"
                : "bg-[#1a1512] border border-[#342b24] text-[#b5aa9a] hover:text-[#f4ede2]"
            }`}
          >
            <Settings strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Studio profile</span>
          </button>
        </div>

        {/* TAB 1: PLATES & SEQUENCE */}
        {activeTab === "photos" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-serif text-2xl text-[#f4ede2]">
                  Exhibition sequence
                </h2>
                <span className="text-xs text-[#9e9283]">
                  Drag handle to reorder plates
                </span>
                {draggedIndex !== null && (
                  <span className="px-2.5 py-0.5 bg-[#e26947]/18 text-[#e26947] border border-[#e26947]/40 text-xs rounded-full">
                    Drop row to save order
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#e26947] hover:bg-[#ec7553] text-[#110e0c] font-semibold text-xs rounded-full transition-colors self-start sm:self-auto cursor-pointer active:scale-[0.98]"
              >
                <Plus strokeWidth={1.75} className="w-3.5 h-3.5" />
                <span>Add photograph</span>
              </button>
            </div>

            <div className="border border-[#312923] rounded-sm overflow-hidden divide-y divide-[#29221d] bg-[#16120f] shadow-xl">
              {photos.length === 0 ? (
                <div className="p-10 text-center text-[#9e9283]">
                  No photographs in the archive yet. Open Upload scan to add your first plate.
                </div>
              ) : (
                photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all duration-150 ${
                      draggedIndex === index
                        ? "opacity-45 bg-[#e26947]/10 scale-[0.995]"
                        : dragOverIndex === index
                        ? "bg-[#221c18] border-t-2 border-t-[#e26947]"
                        : "hover:bg-[#1c1714]"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="flex items-center p-1.5 bg-[#211b17] hover:bg-[#2b231e] border border-[#382f28] rounded-xs cursor-grab active:cursor-grabbing transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical
                            strokeWidth={1.5}
                            className="w-4 h-4 text-[#9e9283]"
                          />
                        </div>
                        <span className="font-mono text-xs text-[#9e9283] tabular-nums w-6 text-right">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="relative w-16 h-12 bg-[#110e0c] border border-[#342b24] rounded-xs overflow-hidden shrink-0">
                        <Image
                          src={photo.url}
                          alt={photo.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif text-lg text-[#f4ede2] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            {photo.title}
                          </h3>

                          {photo.dominantColor && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#211b17] border border-[#382f28] rounded-full text-[10px] font-mono text-[#b5aa9a] tabular-nums"
                              title={`Dominant pigment: ${photo.dominantColor}`}
                            >
                              <span
                                className="color-swatch-chip w-2 h-2 rounded-full border border-[#f4ede2]/25"
                                style={{ backgroundColor: photo.dominantColor }}
                              />
                              <span className="hidden sm:inline">
                                {photo.dominantColor}
                              </span>
                            </span>
                          )}

                          {photo.category && (
                            <span className="px-2 py-0.5 bg-[#211b17] border border-[#382f28] text-[#b5aa9a] text-[11px] rounded-full shrink-0">
                              {photo.category.name}
                            </span>
                          )}

                          {photo.isFeatured && (
                            <span className="px-2 py-0.5 bg-[#d89b52]/15 text-[#d89b52] border border-[#d89b52]/40 text-[11px] rounded-full shrink-0 inline-flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-[#d89b52] text-[#d89b52]" />
                              Featured
                            </span>
                          )}

                          {photo.isHidden && (
                            <span className="px-2 py-0.5 bg-[#331815] text-[#f5c2b8] border border-[#7c352b] text-[11px] rounded-full shrink-0 inline-flex items-center gap-1">
                              <EyeOff strokeWidth={1.5} className="w-2.5 h-2.5" />
                              Hidden
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#8c7f70] font-mono tabular-nums mt-0.5 flex-wrap">
                          <span>{photo.exifCamera || "Medium format"}</span>
                          <span>·</span>
                          <span>
                            {[
                              photo.exifLens,
                              photo.exifAperture,
                              photo.exifShutterSpeed,
                              photo.exifIso ? `ISO ${photo.exifIso}` : null,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t border-[#29221d] md:border-t-0 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(photo.id)}
                        className={`p-2 border rounded-full transition-all cursor-pointer ${
                          photo.isFeatured
                            ? "border-[#d89b52] text-[#d89b52] bg-[#d89b52]/12"
                            : "border-[#382f28] text-[#8c7f70] hover:text-[#d89b52] hover:border-[#57483d] bg-[#1e1815]"
                        }`}
                        title={
                          photo.isFeatured
                            ? "Featured in monograph"
                            : "Mark as featured plate"
                        }
                        aria-label="Toggle featured"
                      >
                        <Star
                          strokeWidth={1.5}
                          className={`w-4 h-4 ${photo.isFeatured ? "fill-[#d89b52]" : ""}`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleHide(photo.id)}
                        className={`p-2 border rounded-full transition-all cursor-pointer ${
                          photo.isHidden
                            ? "border-[#7c352b] text-[#f5c2b8] bg-[#331815]"
                            : "border-[#382f28] text-[#b5aa9a] hover:text-[#f4ede2] hover:border-[#57483d] bg-[#1e1815]"
                        }`}
                        title={
                          photo.isHidden
                            ? "Hidden (click to show in gallery)"
                            : "Visible (click to hide)"
                        }
                        aria-label="Toggle visibility"
                      >
                        {photo.isHidden ? (
                          <EyeOff strokeWidth={1.5} className="w-4 h-4" />
                        ) : (
                          <Eye strokeWidth={1.5} className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 border border-[#382f28] hover:border-[#c84638] text-[#8c7f70] hover:text-[#f5c2b8] bg-[#1e1815] rounded-full transition-colors cursor-pointer"
                        title="Remove photograph from archive"
                        aria-label="Delete photograph"
                      >
                        <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD SCAN */}
        {activeTab === "upload" && (
          <form
            onSubmit={handleUploadSubmit}
            className="max-w-2xl border border-[#362d26] bg-[#181411] p-6 sm:p-8 rounded-sm space-y-5 shadow-xl"
          >
            <div className="flex items-baseline justify-between border-b border-[#312923] pb-3">
              <h2 className="font-serif text-2xl text-[#f4ede2]">
                Add photograph to archive
              </h2>
              <span className="font-mono text-[11px] text-[#8c7f70]">
                JPG, PNG, WebP
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="upload-file"
                className="text-xs font-medium text-[#d9cebf]"
              >
                Image scan
              </label>
              <input
                id="upload-file"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
                className="w-full bg-[#120f0d] border border-[#453930] text-[#bfb3a3] px-3 py-2 text-xs rounded-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#2a221d] file:text-[#f4ede2] hover:file:bg-[#e26947] hover:file:text-[#110e0c] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="upload-title"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Title
                </label>
                <input
                  id="upload-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Skeppsholmen ferry, 6 a.m."
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] placeholder:text-[#7c7063] px-3 py-2 text-sm rounded-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="upload-category"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Series
                </label>
                <select
                  id="upload-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                >
                  <option value="">General archive</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="upload-desc"
                className="text-xs font-medium text-[#d9cebf]"
              >
                Field note or caption
              </label>
              <textarea
                id="upload-desc"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                rows={2}
                placeholder="Deckhands coil wet hemp lines while harbor mist clears..."
                className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] placeholder:text-[#7c7063] px-3 py-2 text-sm rounded-xs"
              />
            </div>

            <div className="border-t border-[#312923] pt-4">
              <span className="text-xs font-medium text-[#d9cebf] mb-3 flex items-center gap-2">
                <Sliders strokeWidth={1.5} className="w-3.5 h-3.5 text-[#d89b52]" />
                Camera & exposure notes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exif-camera" className="text-[11px] text-[#9e9283]">
                    Camera body
                  </label>
                  <input
                    id="exif-camera"
                    type="text"
                    value={exifCamera}
                    onChange={(e) => setExifCamera(e.target.value)}
                    className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-2.5 py-1.5 text-xs font-mono rounded-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exif-lens" className="text-[11px] text-[#9e9283]">
                    Lens
                  </label>
                  <input
                    id="exif-lens"
                    type="text"
                    value={exifLens}
                    onChange={(e) => setExifLens(e.target.value)}
                    className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-2.5 py-1.5 text-xs font-mono rounded-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exif-aperture" className="text-[11px] text-[#9e9283]">
                    Aperture
                  </label>
                  <input
                    id="exif-aperture"
                    type="text"
                    value={exifAperture}
                    onChange={(e) => setExifAperture(e.target.value)}
                    className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-2.5 py-1.5 text-xs font-mono rounded-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exif-shutter" className="text-[11px] text-[#9e9283]">
                    Shutter speed
                  </label>
                  <input
                    id="exif-shutter"
                    type="text"
                    value={exifShutter}
                    onChange={(e) => setExifShutter(e.target.value)}
                    className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-2.5 py-1.5 text-xs font-mono rounded-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exif-iso" className="text-[11px] text-[#9e9283]">
                    Film / ISO
                  </label>
                  <input
                    id="exif-iso"
                    type="text"
                    value={exifIso}
                    onChange={(e) => setExifIso(e.target.value)}
                    className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-2.5 py-1.5 text-xs font-mono rounded-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 px-5 bg-[#e26947] hover:bg-[#ec7553] text-[#110e0c] font-semibold text-sm transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 rounded-full cursor-pointer active:scale-[0.98]"
            >
              <Upload strokeWidth={1.75} className="w-4 h-4" />
              <span>{isUploading ? "Uploading scan..." : "Publish to archive"}</span>
            </button>
          </form>
        )}

        {/* TAB 3: STUDIO PROFILE */}
        {activeTab === "settings" && (
          <form
            onSubmit={handleSaveConfig}
            className="max-w-2xl border border-[#362d26] bg-[#181411] p-6 sm:p-8 rounded-sm space-y-5 shadow-xl"
          >
            <div className="flex items-baseline justify-between border-b border-[#312923] pb-3">
              <h2 className="font-serif text-2xl text-[#f4ede2]">
                Studio profile & colophon
              </h2>
              <span className="font-mono text-[11px] text-[#8c7f70]">
                Public monograph text
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="config-title"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Photographer or studio name
                </label>
                <input
                  id="config-title"
                  type="text"
                  value={config.title || ""}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="config-tagline"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Subtitle
                </label>
                <input
                  id="config-tagline"
                  type="text"
                  value={config.tagline || ""}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="config-bio"
                className="text-xs font-medium text-[#d9cebf]"
              >
                Introduction note
              </label>
              <textarea
                id="config-bio"
                value={config.aboutText || ""}
                onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
                rows={3}
                className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="config-email"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Email
                </label>
                <input
                  id="config-email"
                  type="email"
                  value={config.email || ""}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="config-instagram"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Instagram URL
                </label>
                <input
                  id="config-instagram"
                  type="text"
                  value={config.instagram || ""}
                  onChange={(e) =>
                    setConfig({ ...config, instagram: e.target.value })
                  }
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="config-twitter"
                  className="text-xs font-medium text-[#d9cebf]"
                >
                  Twitter URL
                </label>
                <input
                  id="config-twitter"
                  type="text"
                  value={config.twitter || ""}
                  onChange={(e) => setConfig({ ...config, twitter: e.target.value })}
                  className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] px-3 py-2 text-sm rounded-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-[#e26947] hover:bg-[#ec7553] text-[#110e0c] font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 mt-2 rounded-full cursor-pointer active:scale-[0.98]"
            >
              <Save strokeWidth={1.75} className="w-4 h-4" />
              <span>Save studio profile</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
