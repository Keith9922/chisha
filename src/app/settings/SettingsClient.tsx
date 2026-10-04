"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type Activity,
  type Gender,
  type Goal,
} from "@/lib/types";
import { dailyBudget, proteinTarget, tdee, bmr } from "@/lib/tdee";
import { useToast } from "@/components/Toast";

interface ProfileData {
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: string;
  goal: string;
  bedtime: string;
  budget_kcal: number;
  protein_target: number;
}

interface UserData {
  email: string;
  name: string | null;
}

export default function SettingsClient({
  profile,
  user,
}: {
  profile: ProfileData;
  user: UserData | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (!(await toast.confirm("退出登录？数据保留，下次登录还在。"))) return;
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const [gender, setGender] = useState<Gender>(profile.gender as Gender);
  const [age, setAge] = useState(profile.age);
  const [height, setHeight] = useState(profile.height_cm);
  const [weight, setWeight] = useState(profile.weight_kg);
  const [activity, setActivity] = useState<Activity>(profile.activity as Activity);
  const [goal, setGoal] = useState<Goal>(profile.goal as Goal);
  const [bedtime, setBedtime] = useState(profile.bedtime);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  const calcBmr = bmr({ weight_kg: weight, height_cm: height, age, gender });
  const calcTdee = tdee({ weight_kg: weight, height_cm: height, age, gender, activity });
  const calcBudget = dailyBudget({
    weight_kg: weight, height_cm: height, age, gender, activity, goal,
  });
  const calcProtein = proteinTarget(weight, goal);

  const dirty =
    gender !== profile.gender ||
    age !== profile.age ||
    height !== profile.height_cm ||
    weight !== profile.weight_kg ||
    activity !== profile.activity ||
    goal !== profile.goal ||
    bedtime !== profile.bedtime;

  async function save() {
    setSaving(true);
    setSaved(false);
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender, age,
        height_cm: height, weight_kg: weight,
        activity, goal, bedtime,
        budget_kcal: calcBudget,
        protein_target: calcProtein,
      }),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      router.refresh();
      toast.show("设置已保存", "success");
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.show("保存失败", "error");
    }
  }

  async function clearTodayData() {
    if (!(await toast.confirm("清空今天的所有食物和运动记录？此操作不可撤销。"))) return;
    setResetting(true);
    const r = await fetch("/api/reset?scope=today", { method: "POST" });
    setResetting(false);
    if (r.ok) {
      toast.show("今天的数据已清空", "info");
      router.push("/");
    }
  }

  async function clearAllData() {
    if (!(await toast.confirm("⚠️ 清空所有历史数据 + 对话 + 体重？不可撤销。"))) return;
    if (!(await toast.confirm("再确认一次：所有数据将永久消失。"))) return;
    setResetting(true);
    const r = await fetch("/api/reset?scope=all", { method: "POST" });
    setResetting(false);
    if (r.ok) {
      toast.show("所有数据已清空", "warning");
      router.push("/");
    }
  }

  return (
    <div className="px-5 pb-6">
      <div className="flex items-center justify-between pb-6 pt-3 px-1">
        <Link href="/" className="text-sm" style={{ color: "var(--color-accent)" }}>
          ← 返回
        </Link>
        <h2 className="text-base font-medium">设置</h2>
        <div className="w-12" />
      </div>

      {/* 账号 */}
      {user && (
        <>
          <h3 className="section-title">账号</h3>
          <div className="card p-4 mb-6 flex justify-between items-center">
            <div className="min-w-0 pr-2">
              {user.name && <div className="text-sm font-medium truncate">{user.name}</div>}
              <div className="text-[12px] truncate" style={{ color: user.name ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="text-xs px-3 py-1.5 rounded-full disabled:opacity-50"
              style={{ background: "var(--color-bg-app)", color: "var(--color-text-secondary)" }}
            >
              {loggingOut ? "..." : "退出"}
            </button>
          </div>
        </>
      )}

      {/* 当前算出来的预算 */}
      <div className="card-lg p-5 mb-6">
        <div className="text-[11px] tracking-wider uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
          每日预算
        </div>
        <div className="flex items-baseline gap-2">
          <span className="num text-4xl" style={{ color: "var(--color-accent)" }}>{calcBudget}</span>
          <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>kcal/天</span>
        </div>
        <div className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          基础代谢 {calcBmr} · 总消耗 {calcTdee} · 蛋白目标 {calcProtein}g
        </div>
      </div>

      {/* 个人信息 */}
      <h3 className="section-title">基本信息</h3>
      <div className="card p-4 mb-4 space-y-3">
        <Row label="性别">
          <SegmentedPicker
            options={[{ id: "male", label: "男" }, { id: "female", label: "女" }]}
            value={gender}
            onChange={(v) => setGender(v as Gender)}
          />
        </Row>
        <Row label="年龄">
          <NumberStepper value={age} onChange={setAge} min={12} max={100} unit="岁" />
        </Row>
        <Row label="身高">
          <NumberStepper value={height} onChange={setHeight} min={120} max={220} unit="cm" />
        </Row>
        <Row label="体重">
          <NumberStepper value={weight} onChange={setWeight} min={30} max={200} unit="kg" step={0.1} />
        </Row>
      </div>

      <h3 className="section-title">目标</h3>
      <div className="card p-4 mb-4 space-y-3">
        <Row label="活动量" stack>
          <SegmentedPicker
            options={(Object.keys(ACTIVITY_LABELS) as Activity[]).map((id) => ({
              id, label: { sedentary: "久坐", light: "轻度", moderate: "中度", active: "高强" }[id],
            }))}
            value={activity}
            onChange={(v) => setActivity(v as Activity)}
          />
        </Row>
        <Row label="目标" stack>
          <SegmentedPicker
            options={(Object.keys(GOAL_LABELS) as Goal[]).map((id) => ({
              id, label: GOAL_LABELS[id],
            }))}
            value={goal}
            onChange={(v) => setGoal(v as Goal)}
          />
        </Row>
        <Row label="通常睡觉">
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="num text-base bg-transparent outline-none"
          />
        </Row>
      </div>

      <button
        onClick={save}
        disabled={!dirty || saving}
        className="btn-primary w-full mb-6 disabled:opacity-30"
      >
        {saving ? "保存中..." : saved ? "✓ 已保存" : dirty ? "保存修改" : "无改动"}
      </button>

      {/* 危险区 */}
      <h3 className="section-title">数据管理</h3>
      <div className="card p-4 space-y-2">
        <button
          onClick={clearTodayData}
          disabled={resetting}
          className="w-full text-left px-3 py-3 rounded-lg text-sm flex justify-between items-center hover:opacity-70"
          style={{ background: "var(--color-bg-app)" }}
        >
          <span>清空今天的记录</span>
          <span style={{ color: "var(--color-text-tertiary)" }}>›</span>
        </button>
        <button
          onClick={clearAllData}
          disabled={resetting}
          className="w-full text-left px-3 py-3 rounded-lg text-sm flex justify-between items-center hover:opacity-70"
          style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}
        >
          <span>清空所有数据</span>
          <span style={{ opacity: 0.6 }}>›</span>
        </button>
      </div>

      <div className="text-center mt-8 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        <Link href="/about" style={{ color: "var(--color-text-secondary)" }}>
          关于 吃啥
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children, stack }: { label: string; children: React.ReactNode; stack?: boolean }) {
  if (stack) {
    return (
      <div>
        <div className="text-[12px] mb-2" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex justify-between items-center">
      <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SegmentedPicker({
  options, value, onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--color-bg-app)" }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="flex-1 text-xs px-2 py-1.5 rounded-md transition-all"
            style={{
              background: active ? "var(--color-bg-card)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400,
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : undefined,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberStepper({
  value, onChange, min = 0, max = 999, unit, step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit: string;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
        className="w-7 h-7 rounded-full border flex items-center justify-center text-sm"
        style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
      >−</button>
      <span className="num text-base min-w-[3rem] text-center">{value}{unit && <span className="text-xs ml-0.5" style={{ color: "var(--color-text-tertiary)" }}>{unit}</span>}</span>
      <button
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
        className="w-7 h-7 rounded-full border flex items-center justify-center text-sm"
        style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
      >+</button>
    </div>
  );
}
