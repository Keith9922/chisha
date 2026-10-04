// RSC 入口的统一守卫：
// - 未登录 → middleware 已跳到 /login（这里兜底）
// - DB 未配置 → 跳 /setup
// - profile 不存在 → 跳 /onboarding
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getCurrentUserId } from "./auth";

export interface GuardOk {
  userId: string;
  profile: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>;
}

export async function requireAuth(): Promise<string> {
  const uid = await getCurrentUserId();
  if (!uid) redirect("/login");
  return uid;
}

export async function requireProfile(): Promise<GuardOk> {
  const userId = await requireAuth();
  let profile;
  try {
    profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  } catch (e) {
    console.error("DB error:", e instanceof Error ? e.message : e);
    redirect("/setup");
  }
  if (!profile) redirect("/onboarding");
  return { userId, profile };
}
