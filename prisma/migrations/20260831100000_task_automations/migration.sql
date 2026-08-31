-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SET_COMPLETION_DATE_TODAY', 'SET_PROPERTY_VALUE');

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerStatusId" TEXT NOT NULL,
    "actionType" "AutomationActionType" NOT NULL,
    "propertyId" TEXT,
    "propertyValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Automation_triggerStatusId_idx" ON "Automation"("triggerStatusId");

-- CreateIndex
CREATE INDEX "Automation_propertyId_idx" ON "Automation"("propertyId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_triggerStatusId_fkey" FOREIGN KEY ("triggerStatusId") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "TaskPropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
