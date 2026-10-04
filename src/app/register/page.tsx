import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import RegisterClient from "./RegisterClient";

export const metadata = { title: "注册" };

export default async function RegisterPage() {
  const uid = await getCurrentUserId();
  if (uid) redirect("/");
  return <RegisterClient />;
}
