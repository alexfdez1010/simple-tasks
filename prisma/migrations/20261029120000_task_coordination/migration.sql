-- Expand without removing legacy properties, values, statistics or tasks.
CREATE TYPE "AssigneeKind" AS ENUM ('HUMAN', 'AGENT');
CREATE TYPE "WorkType" AS ENUM ('READY', 'WORKING', 'BLOCKED', 'REVIEW');
CREATE TABLE "Assignee" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "kind" "AssigneeKind" NOT NULL DEFAULT 'HUMAN',
  "color" TEXT NOT NULL DEFAULT '#64748B',
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Assignee_name_key" ON "Assignee"("name");
CREATE TABLE "Project" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
INSERT INTO "Assignee" ("id", "name") VALUES ('assignee-default', 'Alejandro');
INSERT INTO "Project" ("id", "name") VALUES ('project-general', 'General');
-- Preserve every populated legacy assignment, including options not currently used.
INSERT INTO "Assignee" ("id", "name", "kind")
SELECT 'assignee-' || md5(names.name), names.name,
  'HUMAN'::"AssigneeKind"
FROM (
  SELECT DISTINCT jsonb_array_elements_text(d.options::jsonb) AS name
  FROM "TaskPropertyDefinition" d
  WHERE lower(d.name) IN ('responsable', 'assignee') AND d.type = 'SELECT'
  UNION
  SELECT DISTINCT v.value::jsonb #>> '{}'
  FROM "TaskPropertyValue" v JOIN "TaskPropertyDefinition" d ON d.id = v."propertyId"
  WHERE lower(d.name) IN ('responsable', 'assignee') AND jsonb_typeof(v.value::jsonb) = 'string'
) names WHERE length(trim(names.name)) > 0
ON CONFLICT ("name") DO NOTHING;
ALTER TABLE "Status" ADD COLUMN "workType" "WorkType" NOT NULL DEFAULT 'READY';
UPDATE "Status" SET "workType" = 'WORKING' WHERE id = 'in-progress';
UPDATE "Status" SET "workType" = 'BLOCKED' WHERE id = 'blocked';
ALTER TABLE "Task" ADD COLUMN "assigneeId" TEXT NOT NULL DEFAULT 'assignee-default';
ALTER TABLE "Task" ADD COLUMN "projectId" TEXT NOT NULL DEFAULT 'project-general';
UPDATE "Task" t SET "assigneeId" = a.id
FROM "TaskPropertyValue" v
JOIN "TaskPropertyDefinition" d ON d.id = v."propertyId"
JOIN "Assignee" a ON a.name = (v.value::jsonb #>> '{}')
WHERE v."taskId" = t.id AND lower(d.name) IN ('responsable', 'assignee');
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Assignee"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Task_assigneeId_statusId_idx" ON "Task"("assigneeId", "statusId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE TABLE "TaskDependency" (
  "taskId" TEXT NOT NULL,
  "dependsOnId" TEXT NOT NULL,
  CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId", "dependsOnId"),
  CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskDependency_not_self" CHECK ("taskId" <> "dependsOnId")
);
CREATE INDEX "TaskDependency_dependsOnId_idx" ON "TaskDependency"("dependsOnId");

-- Older deployments can still write the configurable assignment property during rollout/rollback.
-- A database bridge keeps the canonical non-null relation synchronized with those writes.
CREATE FUNCTION sync_legacy_task_assignee() RETURNS trigger AS $$
DECLARE owner_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "TaskPropertyDefinition" WHERE id = NEW."propertyId" AND lower(name) IN ('responsable', 'assignee'))
     AND jsonb_typeof(NEW.value::jsonb) = 'string' THEN
    owner_name := NEW.value::jsonb #>> '{}';
    IF length(trim(owner_name)) > 0 THEN
      INSERT INTO "Assignee" (id, name) VALUES ('assignee-' || md5(owner_name), owner_name) ON CONFLICT (name) DO NOTHING;
      UPDATE "Task" SET "assigneeId" = (SELECT id FROM "Assignee" WHERE name = owner_name), "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = NEW."taskId" AND "assigneeId" IS DISTINCT FROM (SELECT id FROM "Assignee" WHERE name = owner_name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER task_legacy_assignee AFTER INSERT OR UPDATE OF value ON "TaskPropertyValue"
FOR EACH ROW EXECUTE FUNCTION sync_legacy_task_assignee();


