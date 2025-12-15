-- CreateTable
CREATE TABLE "TimerSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pomodoroMinutes" INTEGER NOT NULL DEFAULT 25,
    "shortBreakMinutes" INTEGER NOT NULL DEFAULT 5,
    "longBreakMinutes" INTEGER NOT NULL DEFAULT 15,
    "autoStartNext" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimerSettings_userId_key" ON "TimerSettings"("userId");

-- CreateIndex
CREATE INDEX "TimerSettings_userId_idx" ON "TimerSettings"("userId");

-- AddForeignKey
ALTER TABLE "TimerSettings" ADD CONSTRAINT "TimerSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
