-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- DropIndex
DROP INDEX "projects_name_key";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "owner_id" INTEGER;

-- Assign existing projects to a legacy owner (if any exist)
INSERT INTO "users" ("email", "password_hash", "name", "created_at", "updated_at")
SELECT 'legacy@local', '$2a$10$legacyaccountcannotloginxxO9qG8qG8qG8qG8qG8qG8qG8qG8q', 'Legacy Owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "projects");

UPDATE "projects"
SET "owner_id" = (SELECT "id" FROM "users" WHERE "email" = 'legacy@local')
WHERE "owner_id" IS NULL;

-- Fail loudly if any project is still unowned (should not happen)
DELETE FROM "projects" WHERE "owner_id" IS NULL;

ALTER TABLE "projects" ALTER COLUMN "owner_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "projects_owner_id_idx" ON "projects"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_owner_id_name_key" ON "projects"("owner_id", "name");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
