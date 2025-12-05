-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "providerEventType" TEXT,
ADD COLUMN     "rawPayload" JSONB;
