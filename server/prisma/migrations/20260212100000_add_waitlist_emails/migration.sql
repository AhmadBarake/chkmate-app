-- CreateEnum
CREATE TYPE "WaitlistSource" AS ENUM ('WAITLIST', 'NEWSLETTER');

-- CreateTable
CREATE TABLE "WaitlistEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" "WaitlistSource" NOT NULL DEFAULT 'WAITLIST',
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEmail_createdAt_idx" ON "WaitlistEmail"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEmail_email_source_key" ON "WaitlistEmail"("email", "source");
