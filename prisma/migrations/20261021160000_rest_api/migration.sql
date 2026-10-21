CREATE TABLE "ApiToken" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hint" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "canWrite" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE TABLE "ApiRateLimit" (
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL,
  "writes" INTEGER NOT NULL,
  CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("key")
);
