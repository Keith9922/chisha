-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "budget_kcal" INTEGER NOT NULL,
    "protein_target" INTEGER NOT NULL,
    "bedtime" TEXT NOT NULL DEFAULT '23:00',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeEntry" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "food_id" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "meal" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "protein_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carb_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "portion" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "consumed_at" TIMESTAMP(3) NOT NULL,
    "day_id" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'high',
    "source" TEXT NOT NULL DEFAULT 'AI 估算',
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseEntry" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "intensity" TEXT NOT NULL,
    "kcal_burned" INTEGER NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "day_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tool_calls" TEXT,
    "tool_call_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_session_id_key" ON "Profile"("session_id");

-- CreateIndex
CREATE INDEX "IntakeEntry_session_id_day_id_idx" ON "IntakeEntry"("session_id", "day_id");

-- CreateIndex
CREATE INDEX "ExerciseEntry_session_id_day_id_idx" ON "ExerciseEntry"("session_id", "day_id");

-- CreateIndex
CREATE INDEX "ChatMessage_session_id_idx" ON "ChatMessage"("session_id");
