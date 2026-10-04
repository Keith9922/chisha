import { NextResponse, type NextRequest } from "next/server";
import { estimateFood } from "@/lib/estimate";
import { isAIConfigured } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = String(body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }
  if (!isAIConfigured()) {
    return NextResponse.json(
      {
        error: "AI 服务未配置（部署者未设置 MINIMAX_API_KEY）。可以在搜索框搜数据库里已有的食物来记录。",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }
  const est = await estimateFood(query);
  if (!est) {
    return NextResponse.json(
      { error: "AI 估算失败，请稍后重试或换个描述" },
      { status: 500 }
    );
  }
  return NextResponse.json({ estimate: est });
}
