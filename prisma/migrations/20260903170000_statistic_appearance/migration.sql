CREATE TYPE "StatisticColor" AS ENUM (
    'FOREST',
    'OCEAN',
    'IRIS',
    'AMBER',
    'CORAL',
    'GRAPHITE'
);

CREATE TYPE "StatisticSize" AS ENUM (
    'AUTO',
    'COMPACT',
    'SQUARE',
    'WIDE',
    'FULL'
);

ALTER TABLE "StatisticWidget"
ADD COLUMN "color" "StatisticColor" NOT NULL DEFAULT 'FOREST',
ADD COLUMN "size" "StatisticSize" NOT NULL DEFAULT 'AUTO';

UPDATE "StatisticWidget" SET "color" = 'OCEAN' WHERE "id" = 'default-resolution';
UPDATE "StatisticWidget" SET "color" = 'CORAL' WHERE "id" = 'default-overdue';
UPDATE "StatisticWidget" SET "color" = 'IRIS' WHERE "id" = 'default-statuses';
UPDATE "StatisticWidget" SET "color" = 'AMBER' WHERE "id" = 'default-completion-trend';
