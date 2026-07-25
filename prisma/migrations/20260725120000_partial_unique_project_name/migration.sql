-- Soft-deleted projects must not block reusing the same name.
-- Replace the full unique index with a partial unique index on active rows only.
DROP INDEX IF EXISTS "projects_owner_id_name_key";

CREATE UNIQUE INDEX "projects_owner_id_name_active_key"
ON "projects"("owner_id", "name")
WHERE "deleted_at" IS NULL;
