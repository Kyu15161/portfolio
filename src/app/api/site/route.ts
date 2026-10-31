import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let siteConfig = await prisma.siteConfig.findFirst({
      where: { id: "default" },
    });

    if (!siteConfig) {
      siteConfig = await prisma.siteConfig.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ success: true, siteConfig });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
