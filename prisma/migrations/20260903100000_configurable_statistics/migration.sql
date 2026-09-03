CREATE TYPE "StatisticVisualization" AS ENUM ('KPI', 'BAR', 'DONUT', 'LINE');
CREATE TYPE "StatisticMeasure" AS ENUM (
    'COUNT',
    'SUM',
    'AVERAGE',
    'MINIMUM',
    'MAXIMUM',
    'COMPLETION_RATE',
    'AVERAGE_RESOLUTION_TIME',
    'OVERDUE_COUNT',
    'ON_TIME_RATE'
);
CREATE TYPE "StatisticScope" AS ENUM ('ALL', 'ACTIVE', 'COMPLETED');
CREATE TYPE "StatisticGroupBy" AS ENUM ('NONE', 'STATUS', 'PROPERTY', 'DATE');
CREATE TYPE "StatisticDateField" AS ENUM (
    'CREATED_AT',
    'UPDATED_AT',
    'DUE_DATE',
    'COMPLETED_AT',
    'PROPERTY'
);
CREATE TYPE "StatisticDateBucket" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR');

CREATE TABLE "StatisticWidget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visualization" "StatisticVisualization" NOT NULL,
    "measure" "StatisticMeasure" NOT NULL,
    "scope" "StatisticScope" NOT NULL DEFAULT 'ALL',
    "groupBy" "StatisticGroupBy" NOT NULL DEFAULT 'NONE',
    "measurePropertyId" TEXT,
    "groupPropertyId" TEXT,
    "dateField" "StatisticDateField",
    "datePropertyId" TEXT,
    "dateBucket" "StatisticDateBucket",
    "statusIds" JSONB NOT NULL DEFAULT '[]',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StatisticWidget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StatisticWidget_position_idx" ON "StatisticWidget"("position");
CREATE INDEX "StatisticWidget_measurePropertyId_idx" ON "StatisticWidget"("measurePropertyId");
CREATE INDEX "StatisticWidget_groupPropertyId_idx" ON "StatisticWidget"("groupPropertyId");
CREATE INDEX "StatisticWidget_datePropertyId_idx" ON "StatisticWidget"("datePropertyId");

ALTER TABLE "StatisticWidget" ADD CONSTRAINT "StatisticWidget_measurePropertyId_fkey"
FOREIGN KEY ("measurePropertyId") REFERENCES "TaskPropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatisticWidget" ADD CONSTRAINT "StatisticWidget_groupPropertyId_fkey"
FOREIGN KEY ("groupPropertyId") REFERENCES "TaskPropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatisticWidget" ADD CONSTRAINT "StatisticWidget_datePropertyId_fkey"
FOREIGN KEY ("datePropertyId") REFERENCES "TaskPropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "StatisticWidget" (
    "id", "name", "visualization", "measure", "scope", "groupBy",
    "position", "updatedAt"
) VALUES
    ('default-completed', 'Completed tasks', 'KPI', 'COUNT', 'COMPLETED', 'NONE', 0, CURRENT_TIMESTAMP),
    ('default-resolution', 'Average resolution time', 'KPI', 'AVERAGE_RESOLUTION_TIME', 'COMPLETED', 'NONE', 1, CURRENT_TIMESTAMP),
    ('default-overdue', 'Overdue tasks', 'KPI', 'OVERDUE_COUNT', 'ALL', 'NONE', 2, CURRENT_TIMESTAMP),
    ('default-statuses', 'Work by status', 'BAR', 'COUNT', 'ALL', 'STATUS', 3, CURRENT_TIMESTAMP);

INSERT INTO "StatisticWidget" (
    "id", "name", "visualization", "measure", "scope", "groupBy",
    "dateField", "dateBucket", "position", "updatedAt"
) VALUES
    ('default-completion-trend', 'Completion trend', 'LINE', 'COUNT', 'COMPLETED', 'DATE', 'COMPLETED_AT', 'MONTH', 4, CURRENT_TIMESTAMP);
