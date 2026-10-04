import { NextResponse, type NextRequest } from "next/server";
import { searchFoods } from "@/lib/foods";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 12);
  const items = await searchFoods(q, limit);
  return NextResponse.json({ items });
}
