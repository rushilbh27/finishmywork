-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_accepterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_posterId_fkey";
