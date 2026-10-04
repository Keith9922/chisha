import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();

  const data = {
    height_cm: Number(body.height_cm),
    weight_kg: Number(body.weight_kg),
    age: Number(body.age),
    gender: String(body.gender),
    activity: String(body.activity),
    goal: String(body.goal),
    budget_kcal: Number(body.budget_kcal),
    protein_target: Number(body.protein_target),
    bedtime: String(body.bedtime ?? "23:00"),
  };

  await prisma.profile.upsert({
    where: { user_id: userId },
    create: { ...data, user_id: userId },
    update: data,
  });
  return NextResponse.json({ ok: true });
}
