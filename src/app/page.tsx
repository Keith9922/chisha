import { prisma } from "@/lib/db";
import { dayIdOf } from "@/lib/today";
import { getTodayStatus } from "@/lib/today-status";
import { requireProfile } from "@/lib/page-guard";
import Greeting from "@/components/Greeting";
import Dashboard from "@/components/Dashboard";
import MealSection from "@/components/MealSection";
import ExerciseSection from "@/components/ExerciseSection";
import WeightCard from "@/components/WeightCard";

export const dynamic = "force-dynamic";

export default async function RecordingPage() {
  const { userId, profile } = await requireProfile();

  const dayId = dayIdOf();
  const [status, intakes, exercises] = await Promise.all([
    getTodayStatus(userId),
    prisma.intakeEntry.findMany({
      where: { user_id: userId, day_id: dayId },
      orderBy: { consumed_at: "asc" },
    }),
    prisma.exerciseEntry.findMany({
      where: { user_id: userId, day_id: dayId },
      orderBy: { performed_at: "asc" },
    }),
  ]);

  const intakeRows = intakes.map((i) => ({
    id: i.id,
    name: i.name,
    brand: i.brand,
    meal: i.meal,
    kcal: i.kcal,
    portion: i.portion,
    confidence: i.confidence,
    source: i.source,
    reasoning: i.reasoning,
    consumed_at: i.consumed_at.toISOString(),
  }));
  const exerciseRows = exercises.map((e) => ({
    id: e.id,
    type: e.type,
    duration_min: e.duration_min,
    intensity: e.intensity,
    kcal_burned: e.kcal_burned,
    performed_at: e.performed_at.toISOString(),
  }));

  return (
    <div className="px-5">
      <Greeting />
      <Dashboard status={status} />
      <MealSection intakes={intakeRows} />
      <ExerciseSection exercises={exerciseRows} />
      <WeightCard initialWeightKg={profile.weight_kg} />
    </div>
  );
}
