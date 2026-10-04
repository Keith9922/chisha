"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type Activity,
  type Gender,
  type Goal,
} from "@/lib/types";
import { dailyBudget, proteinTarget } from "@/lib/tdee";

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: "male", label: "男" },
  { id: "female", label: "女" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<Activity>("light");
  const [goal, setGoal] = useState<Goal>("lose");
  const [bedtime, setBedtime] = useState("23:00");

  const budget = dailyBudget({
    weight_kg: weight, height_cm: height, age, gender, activity, goal,
  });
  const protein = proteinTarget(weight, goal);

  async function submit() {
    setSubmitting(true);
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender, age,
        height_cm: height, weight_kg: weight,
        activity, goal, bedtime,
        budget_kcal: budget,
        protein_target: protein,
      }),
    });
    if (r.ok) {
      router.push("/");
      router.refresh();
    } else {
      setSubmitting(false);
      alert("保存失败");
    }
  }

  const STEPS = [
    {
      title: "你是？",
      sub: "我们需要这些来计算你的每日热量预算",
      content: (
        <Choices
          options={GENDER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
          value={gender}
          onChange={(v) => setGender(v as Gender)}
        />
      ),
      next: () => setStep(1),
    },
    {
      title: "几岁了？",
      content: (
        <NumberInput value={age} onChange={setAge} min={12} max={100} unit="岁" big />
      ),
      next: () => setStep(2),
    },
    {
      title: "身高、体重",
      content: (
        <div className="space-y-4">
          <div>
            <div className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>身高</div>
            <NumberInput value={height} onChange={setHeight} min={120} max={220} unit="cm" />
          </div>
          <div>
            <div className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>体重</div>
            <NumberInput value={weight} onChange={setWeight} min={30} max={200} unit="kg" />
          </div>
        </div>
      ),
      next: () => setStep(3),
    },
    {
      title: "日常活动量？",
      content: (
        <Choices
          options={(Object.keys(ACTIVITY_LABELS) as Activity[]).map((id) => ({
            id, label: ACTIVITY_LABELS[id],
          }))}
          value={activity}
          onChange={(v) => setActivity(v as Activity)}
          vertical
        />
      ),
      next: () => setStep(4),
    },
    {
      title: "目标？",
      content: (
        <Choices
          options={(Object.keys(GOAL_LABELS) as Goal[]).map((id) => ({
            id, label: GOAL_LABELS[id],
          }))}
          value={goal}
          onChange={(v) => setGoal(v as Goal)}
        />
      ),
      next: () => setStep(5),
    },
    {
      title: "通常几点睡？",
      sub: "用于显示距睡眠时间，默认 23:00",
      content: (
        <div className="card p-5 flex items-center justify-center">
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="text-3xl bg-transparent outline-none num text-center"
          />
        </div>
      ),
      next: () => setStep(6),
    },
    {
      title: "好，看一下数据",
      sub: "可以随时去设置改",
      content: (
        <div className="card p-5 space-y-4">
          <Row label="每日预算" value={`${budget} kcal`} />
          <Row label="蛋白目标" value={`${protein} g`} />
          <Row label="性别 / 年龄" value={`${gender === "male" ? "男" : "女"} · ${age} 岁`} />
          <Row label="身高 / 体重" value={`${height}cm · ${weight}kg`} />
          <Row label="活动量" value={ACTIVITY_LABELS[activity]} />
          <Row label="目标" value={GOAL_LABELS[goal]} />
          <Row label="睡觉" value={bedtime} />
        </div>
      ),
      next: submit,
    },
  ];

  const cur = STEPS[step];

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-12 pb-8">
      <div className="mb-2 text-[11px] tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
        {step + 1} / {STEPS.length}
      </div>
      <h1 className="text-2xl font-medium mb-1">{cur.title}</h1>
      {cur.sub && (
        <div className="text-sm mb-7" style={{ color: "var(--color-text-secondary)" }}>{cur.sub}</div>
      )}
      {!cur.sub && <div className="mb-7" />}

      <div className="flex-1">{cur.content}</div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-3 rounded-xl text-sm"
            style={{ background: "var(--color-bg-card)", color: "var(--color-text-secondary)" }}
          >
            返回
          </button>
        )}
        <button
          onClick={cur.next}
          disabled={submitting}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {submitting ? "保存中..." : step === STEPS.length - 1 ? "开始" : "继续"}
        </button>
      </div>
    </div>
  );
}

function Choices({
  options,
  value,
  onChange,
  vertical,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  vertical?: boolean;
}) {
  return (
    <div className={vertical ? "space-y-2" : `grid gap-2 ${options.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="rounded-xl py-4 px-4 text-sm transition-all text-left"
            style={{
              background: active ? "var(--color-accent-soft)" : "var(--color-bg-card)",
              border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-soft)"}`,
              color: active ? "var(--color-accent)" : "var(--color-text-primary)",
              fontWeight: active ? 500 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({
  value, onChange, min = 0, max = 999, unit, big,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit: string;
  big?: boolean;
}) {
  return (
    <div className="card p-5 flex items-center justify-between">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-full border flex items-center justify-center text-lg"
        style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
      >−</button>
      <div className="flex items-baseline">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className={`num bg-transparent outline-none text-center w-20 ${big ? "text-5xl" : "text-3xl"}`}
        />
        <span className="text-sm ml-1" style={{ color: "var(--color-text-tertiary)" }}>{unit}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-full border flex items-center justify-center text-lg"
        style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
      >+</button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
