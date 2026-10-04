-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "day_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightEntry_session_id_idx" ON "WeightEntry"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "WeightEntry_session_id_day_id_key" ON "WeightEntry"("session_id", "day_id");
