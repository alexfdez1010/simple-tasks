-- CreateEnum
CREATE TYPE "StatisticDateRange" AS ENUM ('ALL_TIME', 'TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'THIS_WEEK', 'THIS_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'NEXT_7_DAYS', 'NEXT_30_DAYS');

-- AlterTable
ALTER TABLE "StatisticWidget"
ADD COLUMN "dateRange" "StatisticDateRange" NOT NULL DEFAULT 'ALL_TIME';
