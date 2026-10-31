"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminLoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        setError(data.error || "Incorrect studio passcode.");
      }
    } catch {
      setError("Network connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#b5aa9a] hover:text-[#f4ede2] transition-colors"
        >
          <ArrowLeft strokeWidth={1.5} className="w-3.5 h-3.5" />
          <span>Return to monograph</span>
        </Link>
      </div>

      <div className="w-full max-w-md border border-[#362d26] bg-[#181411]/95 p-8 shadow-2xl rounded-sm">
        <div className="flex items-center gap-2 text-[#e26947] font-mono text-[11px] uppercase tracking-[0.16em] mb-4">
          <Lock strokeWidth={1.5} className="w-3.5 h-3.5" />
          <span>Studio Archive</span>
        </div>

        <h1 className="font-serif text-3xl text-[#f4ede2] tracking-tight mb-2">
          Print room sign-in
        </h1>
        <p className="text-[#a89c8d] text-sm mb-6 leading-relaxed">
          Enter your studio passcode to arrange plates or upload new scans. Default
          passcode is{" "}
          <code className="font-mono text-xs text-[#d89b52] bg-[#221c18] px-1.5 py-0.5 rounded-xs border border-[#382f28]">
            admin
          </code>
          .
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3 bg-[#331815] border border-[#7c352b] text-[#f5c2b8] text-xs rounded-xs flex items-center gap-2"
          >
            <AlertCircle strokeWidth={1.5} className="w-4 h-4 shrink-0 text-[#e26947]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="studio-passcode"
              className="text-xs font-medium text-[#d9cebf]"
            >
              Passcode
            </label>
            <input
              id="studio-passcode"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode"
              required
              className="w-full bg-[#120f0d] border border-[#453930] focus:border-[#e26947] focus:outline-none text-[#f4ede2] placeholder:text-[#7c7063] px-3.5 py-2.5 text-sm font-mono rounded-xs transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#e26947] hover:bg-[#ec7553] text-[#110e0c] font-semibold text-sm py-2.5 px-4 rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Checking passcode..." : "Open studio archive"}</span>
            <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
