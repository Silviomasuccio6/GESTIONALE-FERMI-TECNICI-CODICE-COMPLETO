-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "attendees" JSONB,
    "reminder" INTEGER NOT NULL DEFAULT 30,
    "visibility" TEXT NOT NULL DEFAULT 'default',
    "availability" TEXT NOT NULL DEFAULT 'BUSY',
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "color" TEXT NOT NULL DEFAULT '#1a73e8',
    "calendarId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_userId_startAt_idx" ON "CalendarEvent"("tenantId", "userId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_startAt_endAt_idx" ON "CalendarEvent"("tenantId", "startAt", "endAt");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
