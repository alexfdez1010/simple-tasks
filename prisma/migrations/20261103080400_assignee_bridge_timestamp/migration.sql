-- The legacy assignment bridge inserts directly rather than through Prisma.
CREATE OR REPLACE FUNCTION sync_legacy_task_assignee() RETURNS trigger AS $$
DECLARE owner_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "TaskPropertyDefinition" WHERE id = NEW."propertyId" AND lower(name) IN ('responsable', 'assignee'))
     AND jsonb_typeof(NEW.value::jsonb) = 'string' THEN
    owner_name := NEW.value::jsonb #>> '{}';
    IF length(trim(owner_name)) > 0 THEN
      INSERT INTO "Assignee" (id, name, "updatedAt")
      VALUES ('assignee-' || md5(owner_name), owner_name, CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO NOTHING;
      UPDATE "Task" SET "assigneeId" = (SELECT id FROM "Assignee" WHERE name = owner_name), "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = NEW."taskId" AND "assigneeId" IS DISTINCT FROM (SELECT id FROM "Assignee" WHERE name = owner_name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
