import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const photo = await prisma.photo.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        exifCamera: body.exifCamera,
        exifLens: body.exifLens,
        exifFocalLength: body.exifFocalLength,
        exifAperture: body.exifAperture,
        exifShutterSpeed: body.exifShutterSpeed,
        exifIso: body.exifIso,
        categoryId: body.categoryId || null,
        dominantColor: body.dominantColor,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.photo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
