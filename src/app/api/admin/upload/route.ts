import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { extractDominantColor, optimizeImageWebP } from "@/lib/color";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Untitled plate";
    const description = (formData.get("description") as string) || "";
    const categoryId = formData.get("categoryId") as string;
    const exifCamera = formData.get("exifCamera") as string;
    const exifLens = formData.get("exifLens") as string;
    const exifAperture = formData.get("exifAperture") as string;
    const exifShutterSpeed = formData.get("exifShutterSpeed") as string;
    const exifIso = formData.get("exifIso") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract dominant color for kinetic background adaptation
    const dominantColor = await extractDominantColor(buffer);

    let url = "";

    // Upload to Cloudinary if configured, otherwise fallback to local filesystem
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinaryResult = await uploadToCloudinary(buffer);
      url = cloudinaryResult.url;
    } else {
      // Local fallback with webp optimization
      const webpBuffer = await optimizeImageWebP(buffer);
      const filename = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.webp`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), webpBuffer);
      url = `/uploads/${filename}`;
    }

    // Get current maximum order
    const maxOrderPhoto = await prisma.photo.findFirst({
      orderBy: { order: "desc" },
    });
    const order = (maxOrderPhoto?.order ?? -1) + 1;

    const photo = await prisma.photo.create({
      data: {
        title,
        description,
        url,
        dominantColor,
        order,
        categoryId: categoryId || undefined,
        exifCamera,
        exifLens,
        exifAperture,
        exifShutterSpeed,
        exifIso,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
