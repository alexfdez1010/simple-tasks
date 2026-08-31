-- Add one-shot, read-triggered automations that create parameterized tasks.
ALTER TYPE "AutomationActionType" ADD VALUE 'CREATE_TASK';

CREATE TYPE "AutomationTriggerType" AS ENUM ('STATUS_CHANGE', 'SCHEDULED');

ALTER TABLE "Automation"
  ALTER COLUMN "triggerStatusId" DROP NOT NULL,
  ADD COLUMN "triggerType" "AutomationTriggerType" NOT NULL DEFAULT 'STATUS_CHANGE',
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "executedAt" TIMESTAMP(3),
  ADD COLUMN "taskTitleTemplate" TEXT,
  ADD COLUMN "taskDescriptionTemplate" TEXT,
  ADD COLUMN "taskStatusId" TEXT,
  ADD COLUMN "taskDueDateOffsetDays" INTEGER,
  ADD COLUMN "taskPropertyValues" JSONB;

CREATE INDEX "Automation_taskStatusId_idx" ON "Automation"("taskStatusId");
CREATE INDEX "Automation_triggerType_scheduledAt_executedAt_idx"
  ON "Automation"("triggerType", "scheduledAt", "executedAt");

ALTER TABLE "Automation"
  ADD CONSTRAINT "Automation_taskStatusId_fkey"
  FOREIGN KEY ("taskStatusId") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE;
