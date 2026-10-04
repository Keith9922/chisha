import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  signAuthToken,
  setAuthCookie,
  isValidEmail,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: "邮箱或密码不对" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // 故意不区分 "邮箱不存在" 和 "密码错"，避免邮箱枚举
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "邮箱或密码不对" }, { status: 401 });
  }

  const token = await signAuthToken({ uid: user.id, email: user.email });
  await setAuthCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
