CREATE TYPE "TaskPropertyType" AS ENUM (
    'TEXT',
    'NUMBER',
    'DATE',
    'SELECT',
    'MULTI_SELECT'
);

CREATE TABLE "TaskPropertyDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaskPropertyType" NOT NULL,
    "position" INTEGER NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    CONSTRAINT "TaskPropertyDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskPropertyValue" (
    "taskId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    CONSTRAINT "TaskPropertyValue_pkey" PRIMARY KEY ("taskId", "propertyId")
);

CREATE UNIQUE INDEX "TaskPropertyDefinition_name_key"
ON "TaskPropertyDefinition"("name");
CREATE INDEX "TaskPropertyDefinition_position_idx"
ON "TaskPropertyDefinition"("position");
CREATE INDEX "TaskPropertyValue_propertyId_idx"
ON "TaskPropertyValue"("propertyId");

ALTER TABLE "TaskPropertyValue" ADD CONSTRAINT "TaskPropertyValue_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskPropertyValue" ADD CONSTRAINT "TaskPropertyValue_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "TaskPropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
