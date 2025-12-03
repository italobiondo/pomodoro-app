/*
  Warnings:

  - You are about to alter the column `title` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
