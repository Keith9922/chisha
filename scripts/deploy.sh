#!/usr/bin/env bash
# 一键部署到 Vercel + Turso
# 前置条件：
#   1. 已经 npm i -g vercel turso
#   2. 已经 vercel login + turso auth login
#   3. 已经填好 .env（用于本地）和准备好 MINIMAX_API_KEY

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
cd "$ROOT"

echo "==============================="
echo "  吃啥 chisha · Deploy 脚本"
echo "==============================="

# 1. Vercel 登录检查
if ! vercel whoami >/dev/null 2>&1; then
  echo "❌ Vercel 未登录。请先：vercel login"
  exit 1
fi

# 2. 项目链接
if [ ! -d ".vercel" ]; then
  echo "→ 链接 Vercel 项目..."
  vercel link
fi

# 3. Turso 数据库（已有则跳过）
if ! command -v turso >/dev/null 2>&1; then
  echo "⚠ 未装 turso CLI。运行：brew install tursodatabase/tap/turso"
  exit 1
fi

if ! turso db show chisha >/dev/null 2>&1; then
  echo "→ 创建 Turso 数据库 'chisha'..."
  turso db create chisha
fi

TURSO_URL=$(turso db show chisha --url)
TURSO_TOKEN=$(turso db tokens create chisha)

echo "→ Turso URL: $TURSO_URL"

# 4. 应用 schema 到云端
echo "→ 把 Prisma schema 推送到 Turso..."
TURSO_DATABASE_URL="$TURSO_URL" TURSO_AUTH_TOKEN="$TURSO_TOKEN" \
  npx prisma migrate deploy

# 5. 设置 Vercel env
echo "→ 设置 Vercel 环境变量（如已存在会先删除）..."
for var in TURSO_DATABASE_URL TURSO_AUTH_TOKEN MINIMAX_API_KEY AI_BASE_URL AI_MODEL; do
  vercel env rm "$var" production --yes 2>/dev/null || true
done

echo "$TURSO_URL"   | vercel env add TURSO_DATABASE_URL production
echo "$TURSO_TOKEN" | vercel env add TURSO_AUTH_TOKEN production

# 让用户输入 MiniMax key（如果 .env 已有就读 .env）
if [ -f .env ] && grep -q "^MINIMAX_API_KEY=" .env; then
  MINIMAX_KEY=$(grep "^MINIMAX_API_KEY=" .env | cut -d'=' -f2 | tr -d '"')
  echo "$MINIMAX_KEY" | vercel env add MINIMAX_API_KEY production
else
  echo "⚠ 需要 MINIMAX_API_KEY，输入："
  vercel env add MINIMAX_API_KEY production
fi

echo "https://api.minimaxi.com/v1" | vercel env add AI_BASE_URL production
echo "MiniMax-M2"                  | vercel env add AI_MODEL production

# 6. 部署
echo "→ 部署到 production..."
vercel --prod

echo ""
echo "==============================="
echo "  ✅ 部署完成"
echo "==============================="
