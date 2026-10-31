import { NextResponse } from "next/server";
import { verifyAdminPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
