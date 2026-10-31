import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "portfolio_admin_session";
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-portfolio-jwt-token-key-2026";
const DEFAULT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // "admin"

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_SHA256 || DEFAULT_HASH;
  const inputHash = hashPassword(password);
  
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password) {
    return true;
  }
  return inputHash.toLowerCase() === configuredHash.toLowerCase();
}

export function createSessionToken(): string {
  const payload = JSON.stringify({
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const hmac = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + hmac;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, signature] = parts;
  try {
    const payloadStr = Buffer.from(encodedPayload, "base64").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payloadStr).digest("hex");
    if (signature !== expectedSig) return false;

    const payload = JSON.parse(payloadStr);
    if (!payload.exp || Date.now() > payload.exp) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(session);
}

export { SESSION_COOKIE };
