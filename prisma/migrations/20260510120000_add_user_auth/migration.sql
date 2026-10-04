-- Drop FK indexes/uniques before column rename
DROP INDEX IF EXISTS "Profile_session_id_key";
DROP INDEX IF EXISTS "IntakeEntry_session_id_day_id_idx";
DROP INDEX IF EXISTS "ExerciseEntry_session_id_day_id_idx";
DROP INDEX IF EXISTS "WeightEntry_session_id_day_id_key";
DROP INDEX IF EXISTS "WeightEntry_session_id_idx";
DROP INDEX IF EXISTS "ChatMessage_session_id_idx";

-- Drop session_id columns (data was wiped)
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "IntakeEntry" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "ExerciseEntry" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "WeightEntry" DROP COLUMN IF EXISTS "session_id";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "session_id";

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Add user_id columns + FKs
ALTER TABLE "Profile" ADD COLUMN "user_id" TEXT NOT NULL;
ALTER TABLE "IntakeEntry" ADD COLUMN "user_id" TEXT NOT NULL;
ALTER TABLE "ExerciseEntry" ADD COLUMN "user_id" TEXT NOT NULL;
ALTER TABLE "WeightEntry" ADD COLUMN "user_id" TEXT NOT NULL;
ALTER TABLE "ChatMessage" ADD COLUMN "user_id" TEXT NOT NULL;

CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");
CREATE INDEX "IntakeEntry_user_id_day_id_idx" ON "IntakeEntry"("user_id", "day_id");
CREATE INDEX "ExerciseEntry_user_id_day_id_idx" ON "ExerciseEntry"("user_id", "day_id");
CREATE UNIQUE INDEX "WeightEntry_user_id_day_id_key" ON "WeightEntry"("user_id", "day_id");
CREATE INDEX "WeightEntry_user_id_idx" ON "WeightEntry"("user_id");
CREATE INDEX "ChatMessage_user_id_idx" ON "ChatMessage"("user_id");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "IntakeEntry" ADD CONSTRAINT "IntakeEntry_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ExerciseEntry" ADD CONSTRAINT "ExerciseEntry_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
