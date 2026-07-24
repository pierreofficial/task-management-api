-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "deleted_at" TIMESTAMP(3);
