-- Optional review keeps the original owner; successful completion still unlocks dependents.
CREATE TYPE "ReviewState" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED');
ALTER TABLE "Task" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "Task" ADD COLUMN "reviewState" "ReviewState" NOT NULL DEFAULT 'NOT_REQUESTED';
ALTER TABLE "Task" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Task" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD CONSTRAINT "Task_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Assignee"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Task_reviewerId_reviewState_idx" ON "Task"("reviewerId", "reviewState");
UPDATE "Status" SET position = position + 1 WHERE position >= COALESCE((SELECT min(position) FROM "Status" WHERE "isTerminal"), 3);
INSERT INTO "Status" (id, name, color, position, "isTerminal", "workType")
SELECT 'review', CASE WHEN EXISTS (SELECT 1 FROM "Status" WHERE name = 'In review') THEN 'Review pending' ELSE 'In review' END, '#A28AB8', COALESCE((SELECT min(position) - 1 FROM "Status" WHERE "isTerminal"), 3), false, 'REVIEW' WHERE EXISTS (SELECT 1 FROM "Status") ON CONFLICT (id) DO NOTHING;

ALTER TABLE "Task" ADD CONSTRAINT "Task_independent_reviewer" CHECK ("reviewerId" IS NULL OR "reviewerId" <> "assigneeId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_approved_completion" CHECK ("reviewerId" IS NULL OR "completedAt" IS NULL OR "reviewState" = 'APPROVED');

-- Existing clients editing reviewed content cannot accidentally retain an old approval.
CREATE FUNCTION invalidate_changed_review() RETURNS trigger AS $$
DECLARE ready_status TEXT;
BEGIN
  IF OLD."reviewState" IN ('PENDING', 'APPROVED') AND
    (NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description OR
     NEW."assigneeId" IS DISTINCT FROM OLD."assigneeId" OR NEW."projectId" IS DISTINCT FROM OLD."projectId" OR NEW."reviewerId" IS DISTINCT FROM OLD."reviewerId") THEN
    NEW."reviewState" := 'NOT_REQUESTED';
    NEW."reviewNote" := NULL;
    NEW."reviewedAt" := NULL;
    NEW."completedAt" := NULL;
    SELECT id INTO ready_status FROM "Status" WHERE NOT "isTerminal" AND "workType" = 'READY' ORDER BY position LIMIT 1;
    IF ready_status IS NULL THEN RAISE EXCEPTION 'Configure a ready state before editing reviewed content'; END IF;
    NEW."statusId" := ready_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER task_changed_review BEFORE UPDATE OF title, description, "assigneeId", "projectId", "reviewerId" ON "Task"
FOR EACH ROW EXECUTE FUNCTION invalidate_changed_review();

CREATE FUNCTION invalidate_changed_property_review() RETURNS trigger AS $$
DECLARE task_id TEXT; property_id TEXT; ready_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.value IS NOT DISTINCT FROM OLD.value THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN task_id := OLD."taskId"; property_id := OLD."propertyId";
  ELSE task_id := NEW."taskId"; property_id := NEW."propertyId"; END IF;
  IF EXISTS (SELECT 1 FROM "TaskPropertyDefinition" WHERE id = property_id AND lower(name) IN ('responsable', 'assignee')) THEN RETURN NULL; END IF;
  SELECT id INTO ready_status FROM "Status" WHERE NOT "isTerminal" AND "workType" = 'READY' ORDER BY position LIMIT 1;
  IF EXISTS (SELECT 1 FROM "Task" WHERE id = task_id AND "reviewState" IN ('PENDING', 'APPROVED')) THEN
    IF ready_status IS NULL THEN RAISE EXCEPTION 'Configure a ready state before editing reviewed content'; END IF;
    UPDATE "Task" SET "reviewState" = 'NOT_REQUESTED', "reviewNote" = NULL, "reviewedAt" = NULL, "completedAt" = NULL, "statusId" = ready_status, "updatedAt" = CURRENT_TIMESTAMP WHERE id = task_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER task_property_changed_review AFTER INSERT OR UPDATE OR DELETE ON "TaskPropertyValue"
FOR EACH ROW EXECUTE FUNCTION invalidate_changed_property_review();
