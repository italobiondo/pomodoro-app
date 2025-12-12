-- CreateEnum
CREATE TYPE "FocusSessionEventType" AS ENUM ('POMODORO_STARTED', 'POMODORO_PAUSED', 'POMODORO_RESUMED', 'POMODORO_FINISHED', 'BREAK_STARTED', 'BREAK_FINISHED', 'BREAK_SKIPPED', 'CYCLE_SKIPPED', 'RESET_CURRENT');

-- CreateTable
CREATE TABLE "TimerState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "remainingSeconds" INTEGER NOT NULL,
    "isRunning" BOOLEAN NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3),
    "completedPomodoros" INTEGER NOT NULL,
    "lastFinishedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusSessionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "focusSessionId" TEXT NOT NULL,
    "type" "FocusSessionEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimerState_userId_key" ON "TimerState"("userId");

-- CreateIndex
CREATE INDEX "TimerState_userId_idx" ON "TimerState"("userId");

-- CreateIndex
CREATE INDEX "FocusSessionEvent_userId_idx" ON "FocusSessionEvent"("userId");

-- CreateIndex
CREATE INDEX "FocusSessionEvent_focusSessionId_idx" ON "FocusSessionEvent"("focusSessionId");

-- AddForeignKey
ALTER TABLE "TimerState" ADD CONSTRAINT "TimerState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSessionEvent" ADD CONSTRAINT "FocusSessionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSessionEvent" ADD CONSTRAINT "FocusSessionEvent_focusSessionId_fkey" FOREIGN KEY ("focusSessionId") REFERENCES "FocusSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
