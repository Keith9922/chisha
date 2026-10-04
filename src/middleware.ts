import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "chisha_auth";
const ALGO = "HS256";

// 公开页面 / 不需要登录的路径
const PUBLIC_PAGES = new Set(["/login", "/register", "/about", "/setup"]);
const PUBLIC_API_PREFIX = "/api/auth/";

function getSecret(): Uint8Array | null {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

async function verify(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret, { algorithms: [ALGO] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 完全公开的页面 / API
  if (PUBLIC_PAGES.has(pathname) || pathname.startsWith(PUBLIC_API_PREFIX)) {
    return NextResponse.next();
  }
  // foods/search 是只读公开（让没登录的用户看到食物库）—— 可选
  if (pathname === "/api/foods/search") {
    return NextResponse.next();
  }

  // 验证 token
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const ok = token ? await verify(token) : false;

  if (!ok) {
    // API 返回 401，页面跳 /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录", code: "UNAUTHENTICATED" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|icon.svg|icon-maskable.svg|manifest.json).*)",
  ],
};
