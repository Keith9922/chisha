import { requireProfile } from "@/lib/page-guard";
import { getCurrentUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  const user = await getCurrentUser();

  return (
    <SettingsClient
      profile={{
        gender: profile.gender,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity: profile.activity,
        goal: profile.goal,
        bedtime: profile.bedtime,
        budget_kcal: profile.budget_kcal,
        protein_target: profile.protein_target,
      }}
      user={user ? { email: user.email, name: user.name } : null}
    />
  );
}
