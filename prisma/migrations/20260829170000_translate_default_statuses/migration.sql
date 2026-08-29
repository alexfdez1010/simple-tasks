UPDATE "Status"
SET "name" = 'Blocked'
WHERE "id" = 'blocked'
  AND "name" = 'Bloqueado'
  AND NOT EXISTS (
    SELECT 1 FROM "Status" AS conflict
    WHERE conflict."name" = 'Blocked' AND conflict."id" <> 'blocked'
  );

UPDATE "Status"
SET "name" = 'To do'
WHERE "id" = 'todo'
  AND "name" = 'Por hacer'
  AND NOT EXISTS (
    SELECT 1 FROM "Status" AS conflict
    WHERE conflict."name" = 'To do' AND conflict."id" <> 'todo'
  );

UPDATE "Status"
SET "name" = 'In progress'
WHERE "id" = 'in-progress'
  AND "name" = 'En progreso'
  AND NOT EXISTS (
    SELECT 1 FROM "Status" AS conflict
    WHERE conflict."name" = 'In progress'
      AND conflict."id" <> 'in-progress'
  );

UPDATE "Status"
SET "name" = 'Done'
WHERE "id" = 'done'
  AND "name" = 'Terminado'
  AND NOT EXISTS (
    SELECT 1 FROM "Status" AS conflict
    WHERE conflict."name" = 'Done' AND conflict."id" <> 'done'
  );
