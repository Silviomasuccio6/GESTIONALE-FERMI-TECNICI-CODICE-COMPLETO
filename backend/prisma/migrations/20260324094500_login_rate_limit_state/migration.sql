-- CreateTable
CREATE TABLE "LoginRateLimitState" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginRateLimitState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginRateLimitState_scope_identifier_key" ON "LoginRateLimitState"("scope", "identifier");

-- CreateIndex
CREATE INDEX "LoginRateLimitState_scope_blockedUntil_idx" ON "LoginRateLimitState"("scope", "blockedUntil");
