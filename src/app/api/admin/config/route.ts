import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(req: Request) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const updated = await prisma.siteConfig.upsert({
      where: { id: "default" },
      update: {
        title: data.title,
        tagline: data.tagline,
        aboutText: data.aboutText,
        email: data.email,
        instagram: data.instagram,
        twitter: data.twitter,
      },
      create: {
        id: "default",
        title: data.title || "Maren Lindqvist",
        tagline: data.tagline || "",
        aboutText: data.aboutText || "",
        email: data.email || "",
        instagram: data.instagram || "",
        twitter: data.twitter || "",
      },
    });

    return NextResponse.json({ success: true, siteConfig: updated });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
