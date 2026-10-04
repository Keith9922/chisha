# 吃啥 / chisha

> 对话式饮食与运动记录 — 给一二线城市白领的极简健身教练。

## 这是个啥

打开就能用的减脂助手。三件事：

1. **看见**：仪表盘永远在那 — 今日剩多少 kcal，蛋白吃够没，距睡觉还有几个小时，一眼。
2. **记录**：4 类餐次 + 运动卡片，点开就加。或者直接对 AI 说"我吃了 XX"，它会自己查、自己记。
3. **对话**：AI 知道你今天吃了啥、剩多少预算。问"还能吃个奶茶吗"，它会算给你看。凌晨想吃泡面？它会吐槽。

针对**预制食物为主的都市饮食**：连锁餐饮 + 便利店 + 茶饮 = ~65% 的日常摄入是可标定的。剩下的家常菜 AI 估算补上。

---

## 怎么用

### 第一次打开

1. 走 6 步注册（性别 / 年龄 / 身高 / 体重 / 活动量 / 目标 / 睡觉时间）
2. 自动算出每日热量预算（用的是 Mifflin-St Jeor 标准公式 + 减脂 500 kcal 缺口）
3. 落到记录页

### 加食物两种方式

**A. 卡片式（点 + 早餐 / 午餐 / ...）**
- 输入名字 → DB 命中就直接选 → 否则 AI 估算
- AI 估算会显示**怎么算的**（"米饭 150g + 鸡蛋 2 个 + 油 20g..."）
- 调份量、改时间、确认

**B. 对话式（点 💬 助手）**
- 直接说"我中午吃了一份西红柿炒蛋盖饭和一杯豆浆"
- AI 自己分项、查数据库、记录
- 能问"还能吃个奶茶吗"、"刚跑了 5 公里"等

### 数据来源标签

每条记录都带颜色标签让你知道数据有多准：

| 标签 | 含义 | 例子 |
|---|---|---|
| 🟢 **官方** | 品牌官网营养表 | 麦当劳官网（最准） |
| 🟢 **包装** | 食品包装标注 | 可口可乐 330ml |
| 🔵 **标准** | 中国食物成分表 | 香蕉、米饭 |
| 🟣 **AI** | AI 根据描述估算 | 妈妈做的红烧肉 |
| ⚪ **估算** | 数据库内估算 | 没有官方数据的连锁 |

---

## 部署到自己的 Vercel

整个 app 设计成**单文件部署，多用户共享**（每个浏览器一份独立数据，cookie 隔离）。

### 一、准备

需要这两个免费账号：
- **Vercel**（部署）→ https://vercel.com
- **Turso**（云端 SQLite）→ https://turso.tech
- **MiniMax 平台 Token Plan**（AI）→ https://platform.minimaxi.com

### 二、Turso 数据库

```bash
# 装 Turso CLI（macOS）
brew install tursodatabase/tap/turso

# 登录 + 建库
turso auth signup
turso db create chisha

# 拿 URL 和 token
turso db show chisha --url
turso db tokens create chisha
```

### 三、Vercel 部署

```bash
# 装 Vercel CLI（如果没装）
npm i -g vercel

# 在项目目录
vercel login
vercel link  # 选择 / 创建项目

# 设置环境变量
vercel env add MINIMAX_API_KEY      # 你的 MiniMax key
vercel env add AI_BASE_URL           # https://api.minimaxi.com/v1
vercel env add AI_MODEL              # MiniMax-M2
vercel env add TURSO_DATABASE_URL    # libsql://xxx.turso.io（上面拿到的）
vercel env add TURSO_AUTH_TOKEN      # eyJ... （上面拿到的）

# 应用 schema 到云端 Turso
TURSO_DATABASE_URL="libsql://xxx" TURSO_AUTH_TOKEN="eyJ..." npx prisma migrate deploy

# 部署
vercel --prod
```

或者用根目录的快捷脚本：

```bash
bash scripts/deploy.sh
```

部署完成后，访问 `https://your-project.vercel.app`，分享给朋友就行。每个人首次打开都会走自己的注册流程，数据互不影响。

---

## 本地开发

```bash
npm install

# 配 .env（参考 .env.example）
cp .env.example .env
# 填 MINIMAX_API_KEY

# 初始化 DB
npx prisma migrate dev

# 跑起来
npm run dev
# http://localhost:3000
```

## 切换 AI 模型

代码用的是 OpenAI 兼容协议，环境变量改改就能切：

```bash
# 默认 MiniMax-M2 (CN)
AI_BASE_URL=https://api.minimaxi.com/v1
AI_MODEL=MiniMax-M2

# 切到 OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-5-mini
MINIMAX_API_KEY=sk-...    # 复用环境变量名

# 切到 DeepSeek
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

## 项目结构

```
chisha/
├── data/foods.json          # 565 条食物数据（连锁 + 标准 + 包装）
├── docs/ui-preview.html     # 设计稿预览
├── prisma/schema.prisma     # 数据模型（4 张表，按 session 隔离）
├── scripts/deploy.sh        # 一键部署脚本
├── src/
│   ├── middleware.ts        # 给每个浏览器分配 session cookie
│   ├── app/
│   │   ├── page.tsx         # 记录页
│   │   ├── chat/            # AI 对话
│   │   ├── history/         # 历史记录 + 周打卡 + 7 天图
│   │   ├── settings/        # 改 profile、清数据
│   │   ├── about/           # 介绍
│   │   ├── onboarding/      # 6 步注册
│   │   └── api/             # 9 个端点：chat/today/foods/log/profile/reset/...
│   ├── components/          # Dashboard / MealSection / Sheets / WeekChart 等
│   └── lib/
│       ├── session.ts       # cookie 读 session_id
│       ├── ai.ts            # MiniMax 客户端
│       ├── ai-tools.ts      # 5 个 AI 工具
│       ├── estimate.ts      # AI 估算端点
│       ├── tdee.ts          # Mifflin-St Jeor 公式
│       ├── met.ts           # 19 种运动 MET 表
│       ├── foods.ts         # 食物数据库加载
│       └── today*.ts        # 当日 / 历史聚合
└── .env                     # 环境变量
```

## 隐私

- 每个浏览器一份独立数据，存在你部署的 Turso DB 里
- AI 对话内容只有你这个 session 看得到
- 想清空？设置页 → 数据管理

## License

MIT — 用得开心。
