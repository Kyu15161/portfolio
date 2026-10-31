import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: { isFeatured: !photo.isFeatured },
    });

    return NextResponse.json({ success: true, isFeatured: updated.isFeatured });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
