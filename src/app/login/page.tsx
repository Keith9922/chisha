import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // 已登录就直接跳走
  const uid = await getCurrentUserId();
  if (uid) redirect("/");

  const sp = await searchParams;
  return <LoginClient nextUrl={sp.next ?? "/"} />;
}
