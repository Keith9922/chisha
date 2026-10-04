// 自己写的简单认证：bcrypt 哈希密码 + JWT cookie
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const AUTH_COOKIE = "chisha_auth";
const TOKEN_TTL_DAYS = 30;
const ALGO = "HS256";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET 未设置或太短（至少 16 字符）");
  }
  return new TextEncoder().encode(s);
}

// === 密码 ===
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// === JWT ===
export interface AuthPayload {
  uid: string;       // user.id
  email: string;
}

export async function signAuthToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGO })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_DAYS}d`)
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGO] });
    if (typeof payload.uid !== "string" || typeof payload.email !== "string") return null;
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

// === Server-side helpers (RSC + route handlers) ===

/** 获取当前登录用户 ID（不存在则返回 null） */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  return payload?.uid ?? null;
}

/** 获取当前登录用户对象（不存在/失效则返回 null） */
export async function getCurrentUser() {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    select: { id: true, email: true, name: true, created_at: true },
  });
}

/** 在 API route handler 里写 cookie */
export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * TOKEN_TTL_DAYS,
    path: "/",
  });
}

/** 清 cookie（登出） */
export async function clearAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

// === Validation ===
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s) && s.length <= 254;
}
export function passwordIssue(s: string): string | null {
  if (s.length < 8) return "密码至少 8 位";
  if (s.length > 200) return "密码太长";
  return null;
}
