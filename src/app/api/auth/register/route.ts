import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  signAuthToken,
  setAuthCookie,
  isValidEmail,
  passwordIssue,
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
  const name = body.name ? String(body.name).trim().slice(0, 50) : null;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "邮箱格式不对" }, { status: 400 });
  }
  const pwIssue = passwordIssue(password);
  if (pwIssue) {
    return NextResponse.json({ error: pwIssue }, { status: 400 });
  }

  // 重复邮箱
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "这个邮箱已经注册过" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: await hashPassword(password),
      name,
    },
    select: { id: true, email: true, name: true },
  });

  const token = await signAuthToken({ uid: user.id, email: user.email });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true, user });
}
