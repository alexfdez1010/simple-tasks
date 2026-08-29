CREATE TABLE "Status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "statusId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");
CREATE INDEX "Status_position_idx" ON "Status"("position");
CREATE INDEX "Task_statusId_position_idx" ON "Task"("statusId", "position");
CREATE INDEX "Task_statusId_completedAt_idx" ON "Task"("statusId", "completedAt" DESC);

ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey"
FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
