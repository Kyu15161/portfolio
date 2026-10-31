import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      where: { isHidden: false },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { category: true },
    });
    return NextResponse.json({ success: true, photos });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
