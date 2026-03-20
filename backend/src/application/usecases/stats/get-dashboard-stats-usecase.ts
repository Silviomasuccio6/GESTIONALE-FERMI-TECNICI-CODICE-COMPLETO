import { StoppageStatus } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/prisma/client.js";

type AnalyticsFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  siteId?: string;
  workshopId?: string;
  status?: StoppageStatus;
  plate?: string;
  brand?: string;
  model?: string;
};

const dayMs = 86400000;

const daysDiff = (from: Date, to: Date) => Math.max(0, (to.getTime() - from.getTime()) / dayMs);

const percentile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
};

const median = (sorted: number[]) => {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
};

export class GetDashboardStatsUseCase {
  async dashboardOverview(tenantId: string) {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * dayMs);

    const [stoppages, users, reminders] = await Promise.all([
      prisma.stoppage.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          site: true,
          workshop: true,
          vehicle: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true }
      }),
      prisma.reminder.findMany({
        where: { tenantId },
        orderBy: { sentAt: "desc" },
        take: 8,
        include: {
          stoppage: {
            include: {
              vehicle: { select: { plate: true } }
            }
          }
        }
      })
    ]);

    const activeStatuses = new Set<StoppageStatus>(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED"]);
    const openStoppages = stoppages.filter((x) => activeStatuses.has(x.status));
    const closed = stoppages.filter((x) => x.status === "CLOSED" && x.closedAt);
    const newLast30 = stoppages.filter((x) => x.createdAt >= last30).length;
    const closedLast30 = stoppages.filter((x) => x.closedAt && x.closedAt >= last30).length;
    const criticalOpen = openStoppages.filter((x) => x.priority === "CRITICAL").length;
    const overdueOpen = openStoppages.filter((x) => daysDiff(x.openedAt, now) > 30).length;

    const closureDurations = closed.map((x) => daysDiff(x.openedAt, x.closedAt!));
    const avgClosureDays = closureDurations.length
      ? closureDurations.reduce((acc, value) => acc + value, 0) / closureDurations.length
      : 0;

    const byStatus = Object.values(StoppageStatus).map((status) => ({
      status,
      count: stoppages.filter((x) => x.status === status).length
    }));

    const recentStoppages = stoppages.slice(0, 8).map((x) => ({
      id: x.id,
      createdAt: x.createdAt,
      status: x.status,
      priority: x.priority,
      reason: x.reason,
      site: x.site.name,
      workshop: x.workshop.name,
      plate: x.vehicle.plate,
      brand: x.vehicle.brand,
      model: x.vehicle.model
    }));

    const alerts = openStoppages
      .map((x) => ({
        id: x.id,
        severity:
          x.priority === "CRITICAL" || daysDiff(x.openedAt, now) > 45
            ? "HIGH"
            : x.priority === "HIGH" || daysDiff(x.openedAt, now) > 20
              ? "MEDIUM"
              : "LOW",
        message: `${x.vehicle.plate} fermo da ${Math.round(daysDiff(x.openedAt, now))} giorni`,
        status: x.status,
        site: x.site.name,
        workshop: x.workshop.name
      }))
      .sort((a, b) => (a.severity < b.severity ? 1 : -1))
      .slice(0, 8);

    return {
      kpis: {
        totalStoppages: stoppages.length,
        openStoppages: openStoppages.length,
        newStoppagesLast30: newLast30,
        closedLast30,
        criticalOpen,
        overdueOpen,
        averageClosureDays: Number(avgClosureDays.toFixed(2))
      },
      charts: {
        byStatus
      },
      feeds: {
        recentUsers: users,
        recentStoppages,
        recentReminders: reminders.map((x) => ({
          id: x.id,
          sentAt: x.sentAt,
          success: x.success,
          type: x.type,
          channel: x.channel,
          recipient: x.recipient,
          plate: x.stoppage.vehicle.plate
        })),
        alerts
      }
    };
  }

  async analytics(tenantId: string, filters: AnalyticsFilters) {
    const now = new Date();
    const start = filters.dateFrom ?? new Date(now.getTime() - 90 * dayMs);
    const end = filters.dateTo ?? now;

    const where = {
      tenantId,
      deletedAt: null,
      ...(filters.siteId ? { siteId: filters.siteId } : {}),
      ...(filters.workshopId ? { workshopId: filters.workshopId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      openedAt: { gte: start, lte: end },
      vehicle: {
        ...(filters.plate ? { plate: { contains: filters.plate, mode: "insensitive" as const } } : {}),
        ...(filters.brand ? { brand: { contains: filters.brand, mode: "insensitive" as const } } : {}),
        ...(filters.model ? { model: { contains: filters.model, mode: "insensitive" as const } } : {})
      }
    };

    const stoppages = await prisma.stoppage.findMany({
      where,
      include: {
        site: true,
        workshop: true,
        vehicle: true,
        reminders: true
      },
      orderBy: { openedAt: "desc" }
    });

    const reminderIds = stoppages.map((x) => x.id);
    const reminders = reminderIds.length
      ? await prisma.reminder.findMany({
          where: { tenantId, stoppageId: { in: reminderIds }, sentAt: { gte: start, lte: end } },
          orderBy: { sentAt: "asc" }
        })
      : [];

    const activeStatuses = new Set<StoppageStatus>(["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED"]);
    const closed = stoppages.filter((x) => x.status === "CLOSED" && x.closedAt);
    const open = stoppages.filter((x) => activeStatuses.has(x.status));
    const closureDurations = closed.map((x) => daysDiff(x.openedAt, x.closedAt!)).sort((a, b) => a - b);
    const openAges = open.map((x) => daysDiff(x.openedAt, now));
    const totalReminders = reminders.length;
    const successReminders = reminders.filter((x) => x.success).length;
    const manualReminders = reminders.filter((x) => x.type === "MANUAL").length;
    const automaticReminders = reminders.filter((x) => x.type === "AUTOMATIC").length;

    const statusCounts = Object.values(StoppageStatus).map((status) => ({
      status,
      count: stoppages.filter((x) => x.status === status).length
    }));

    const priorityCounts = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => ({
      priority,
      count: stoppages.filter((x) => x.priority === priority).length
    }));

    const bySiteMap = new Map<string, number>();
    const byWorkshopMap = new Map<string, number>();
    const byBrandMap = new Map<string, number>();
    const byVehicleMap = new Map<string, { plate: string; brand: string; model: string; count: number; openDays: number }>();
    const openedDailyMap = new Map<string, number>();
    const closedDailyMap = new Map<string, number>();
    const reminderDailyMap = new Map<string, number>();

    for (const stoppage of stoppages) {
      bySiteMap.set(stoppage.site.name, (bySiteMap.get(stoppage.site.name) ?? 0) + 1);
      byWorkshopMap.set(stoppage.workshop.name, (byWorkshopMap.get(stoppage.workshop.name) ?? 0) + 1);
      byBrandMap.set(stoppage.vehicle.brand, (byBrandMap.get(stoppage.vehicle.brand) ?? 0) + 1);

      const vehicleKey = stoppage.vehicleId;
      const existingVehicle = byVehicleMap.get(vehicleKey) ?? {
        plate: stoppage.vehicle.plate,
        brand: stoppage.vehicle.brand,
        model: stoppage.vehicle.model,
        count: 0,
        openDays: 0
      };
      existingVehicle.count += 1;
      existingVehicle.openDays += daysDiff(stoppage.openedAt, stoppage.closedAt ?? now);
      byVehicleMap.set(vehicleKey, existingVehicle);

      const openKey = stoppage.openedAt.toISOString().slice(0, 10);
      openedDailyMap.set(openKey, (openedDailyMap.get(openKey) ?? 0) + 1);

      if (stoppage.closedAt) {
        const closeKey = stoppage.closedAt.toISOString().slice(0, 10);
        closedDailyMap.set(closeKey, (closedDailyMap.get(closeKey) ?? 0) + 1);
      }
    }

    for (const reminder of reminders) {
      const key = reminder.sentAt.toISOString().slice(0, 10);
      reminderDailyMap.set(key, (reminderDailyMap.get(key) ?? 0) + 1);
    }

    const trendRange: string[] = [];
    for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + dayMs)) {
      trendRange.push(cursor.toISOString().slice(0, 10));
    }

    const trendStoppages = trendRange.map((day) => ({
      day,
      opened: openedDailyMap.get(day) ?? 0,
      closed: closedDailyMap.get(day) ?? 0,
      reminders: reminderDailyMap.get(day) ?? 0
    }));

    const agingBuckets = [
      { bucket: "0-3", count: 0 },
      { bucket: "4-7", count: 0 },
      { bucket: "8-15", count: 0 },
      { bucket: "16-30", count: 0 },
      { bucket: "31+", count: 0 }
    ];

    for (const age of openAges) {
      if (age <= 3) agingBuckets[0].count += 1;
      else if (age <= 7) agingBuckets[1].count += 1;
      else if (age <= 15) agingBuckets[2].count += 1;
      else if (age <= 30) agingBuckets[3].count += 1;
      else agingBuckets[4].count += 1;
    }

    const averageClosure = closureDurations.length
      ? closureDurations.reduce((acc, value) => acc + value, 0) / closureDurations.length
      : 0;
    const averageOpenAge = openAges.length ? openAges.reduce((acc, value) => acc + value, 0) / openAges.length : 0;
    const closureRate7 = closed.length ? (closed.filter((x) => daysDiff(x.openedAt, x.closedAt!) <= 7).length / closed.length) * 100 : 0;
    const closureRate30 = closed.length ? (closed.filter((x) => daysDiff(x.openedAt, x.closedAt!) <= 30).length / closed.length) * 100 : 0;
    const closureRate60 = closed.length ? (closed.filter((x) => daysDiff(x.openedAt, x.closedAt!) <= 60).length / closed.length) * 100 : 0;

    const estimatedOpenCost = open.reduce((acc, x) => acc + (x.estimatedCostPerDay ?? 0) * daysDiff(x.openedAt, now), 0);
    const estimatedTotalCost = stoppages.reduce((acc, x) => acc + (x.estimatedCostPerDay ?? 0) * daysDiff(x.openedAt, x.closedAt ?? now), 0);

    return {
      filtersApplied: {
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
        siteId: filters.siteId ?? null,
        workshopId: filters.workshopId ?? null,
        status: filters.status ?? null,
        plate: filters.plate ?? null,
        brand: filters.brand ?? null,
        model: filters.model ?? null
      },
      kpis: {
        totalStoppages: stoppages.length,
        openStoppages: open.length,
        closedStoppages: closed.length,
        canceledStoppages: stoppages.filter((x) => x.status === "CANCELED").length,
        criticalOpen: open.filter((x) => x.priority === "CRITICAL").length,
        highOpen: open.filter((x) => x.priority === "HIGH").length,
        averageClosureDays: Number(averageClosure.toFixed(2)),
        medianClosureDays: Number(median(closureDurations).toFixed(2)),
        p90ClosureDays: Number(percentile(closureDurations, 90).toFixed(2)),
        averageOpenAgeDays: Number(averageOpenAge.toFixed(2)),
        closureRateWithin7Days: Number(closureRate7.toFixed(2)),
        closureRateWithin30Days: Number(closureRate30.toFixed(2)),
        closureRateWithin60Days: Number(closureRate60.toFixed(2)),
        remindersTotal: totalReminders,
        reminderSuccessRate: totalReminders ? Number(((successReminders / totalReminders) * 100).toFixed(2)) : 0,
        automaticReminderRate: totalReminders ? Number(((automaticReminders / totalReminders) * 100).toFixed(2)) : 0,
        manualReminderRate: totalReminders ? Number(((manualReminders / totalReminders) * 100).toFixed(2)) : 0,
        remindersPerStoppage: stoppages.length ? Number((totalReminders / stoppages.length).toFixed(2)) : 0,
        estimatedOpenCost: Number(estimatedOpenCost.toFixed(2)),
        estimatedTotalCost: Number(estimatedTotalCost.toFixed(2))
      },
      charts: {
        byStatus: statusCounts,
        byPriority: priorityCounts,
        bySite: Array.from(bySiteMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        byWorkshop: Array.from(byWorkshopMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        byBrand: Array.from(byBrandMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        agingBuckets,
        trendStoppages
      },
      tables: {
        topVehiclesDowntime: Array.from(byVehicleMap.values())
          .sort((a, b) => b.openDays - a.openDays)
          .slice(0, 10)
          .map((x) => ({ ...x, openDays: Number(x.openDays.toFixed(2)) })),
        longestOpen: open
          .map((x) => ({
            id: x.id,
            plate: x.vehicle.plate,
            brand: x.vehicle.brand,
            model: x.vehicle.model,
            site: x.site.name,
            workshop: x.workshop.name,
            status: x.status,
            priority: x.priority,
            openDays: Number(daysDiff(x.openedAt, now).toFixed(2))
          }))
          .sort((a, b) => b.openDays - a.openDays)
          .slice(0, 10),
        reminderFailures: reminders
          .filter((x) => !x.success)
          .slice(-10)
          .reverse()
          .map((x) => ({
            id: x.id,
            sentAt: x.sentAt,
            recipient: x.recipient,
            type: x.type,
            errorMessage: x.errorMessage
          }))
      }
    };
  }

  async workshopHealth(tenantId: string, dateFrom?: Date, dateTo?: Date) {
    const now = new Date();
    const start = dateFrom ?? new Date(now.getTime() - 180 * dayMs);
    const end = dateTo ?? now;

    const rows = await prisma.stoppage.findMany({
      where: { tenantId, deletedAt: null, openedAt: { gte: start, lte: end } },
      include: { workshop: true, reminders: true }
    });

    const grouped = new Map<
      string,
      { name: string; total: number; closed: number; totalClosureDays: number; reminders: number; reminderFailures: number; openOver30: number }
    >();

    for (const row of rows) {
      const g = grouped.get(row.workshopId) ?? {
        name: row.workshop.name,
        total: 0,
        closed: 0,
        totalClosureDays: 0,
        reminders: 0,
        reminderFailures: 0,
        openOver30: 0
      };
      g.total += 1;
      if (row.closedAt) {
        g.closed += 1;
        g.totalClosureDays += daysDiff(row.openedAt, row.closedAt);
      } else if (daysDiff(row.openedAt, now) > 30) {
        g.openOver30 += 1;
      }
      g.reminders += row.reminders.length;
      g.reminderFailures += row.reminders.filter((x) => !x.success).length;
      grouped.set(row.workshopId, g);
    }

    const data = Array.from(grouped.entries()).map(([workshopId, g]) => {
      const avgClosure = g.closed ? g.totalClosureDays / g.closed : 999;
      const failureRate = g.reminders ? (g.reminderFailures / g.reminders) * 100 : 0;
      const closureRate = g.total ? (g.closed / g.total) * 100 : 0;
      const over30Rate = g.total ? (g.openOver30 / g.total) * 100 : 0;

      // score 0-100: higher is better
      const score = Math.max(
        0,
        Math.min(
          100,
          100 -
            avgClosure * 1.3 -
            failureRate * 0.7 -
            over30Rate * 0.8 +
            closureRate * 0.4
        )
      );

      return {
        workshopId,
        workshop: g.name,
        totalStoppages: g.total,
        averageClosureDays: Number((g.closed ? avgClosure : 0).toFixed(2)),
        closureRate: Number(closureRate.toFixed(2)),
        reminderFailureRate: Number(failureRate.toFixed(2)),
        over30OpenRate: Number(over30Rate.toFixed(2)),
        healthScore: Number(score.toFixed(2)),
        grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E"
      };
    });

    return data.sort((a, b) => b.healthScore - a.healthScore);
  }

  async teamPerformance(tenantId: string, dateFrom?: Date, dateTo?: Date) {
    const now = new Date();
    const start = dateFrom ?? new Date(now.getTime() - 90 * dayMs);
    const end = dateTo ?? now;

    const [users, stoppages] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, email: true }
      }),
      prisma.stoppage.findMany({
        where: { tenantId, deletedAt: null, openedAt: { gte: start, lte: end } },
        select: { id: true, assignedToUserId: true, status: true, openedAt: true, closedAt: true }
      })
    ]);

    return users.map((user) => {
      const assigned = stoppages.filter((x) => x.assignedToUserId === user.id);
      const closed = assigned.filter((x) => x.status === "CLOSED" && x.closedAt);
      const avgClosure = closed.length
        ? closed.reduce((acc, x) => acc + daysDiff(x.openedAt, x.closedAt!), 0) / closed.length
        : 0;
      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        assignedTotal: assigned.length,
        closedTotal: closed.length,
        openTotal: assigned.length - closed.length,
        avgClosureDays: Number(avgClosure.toFixed(2))
      };
    });
  }

  async aiSuggestions(tenantId: string) {
    const now = new Date();
    const rows = await prisma.stoppage.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_PARTS", "SOLICITED"] }
      },
      include: { vehicle: true, workshop: true, site: true }
    });

    const suggestions = rows
      .map((item) => {
        const days = daysDiff(item.openedAt, now);
        const risk = Math.min(
          100,
          Math.round(
            days * 3 +
              (item.priority === "CRITICAL" ? 35 : item.priority === "HIGH" ? 22 : item.priority === "MEDIUM" ? 12 : 5) +
              (item.status === "WAITING_PARTS" ? 10 : 0)
          )
        );
        return {
          stoppageId: item.id,
          plate: item.vehicle.plate,
          site: item.site.name,
          workshop: item.workshop.name,
          status: item.status,
          priority: item.priority,
          daysOpen: Number(days.toFixed(1)),
          riskScore: risk,
          recommendation:
            risk >= 80
              ? "Escalation immediata e contatto officina entro 2 ore"
              : risk >= 60
                ? "Inviare sollecito prioritario e verificare ETA ricambi"
                : "Monitoraggio standard con reminder schedulato"
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20);

    return { data: suggestions };
  }

  async workshopsCapacity(tenantId: string, dateFrom?: Date, dateTo?: Date) {
    const now = new Date();
    const start = dateFrom ?? new Date(now.getTime() - 30 * dayMs);
    const end = dateTo ?? new Date(now.getTime() + 30 * dayMs);
    const rows = await prisma.stoppage.findMany({
      where: {
        tenantId,
        deletedAt: null,
        openedAt: { lte: end },
        OR: [{ closedAt: null }, { closedAt: { gte: start } }]
      },
      include: { workshop: true }
    });
    const map = new Map<string, { workshop: string; active: number; critical: number; high: number }>();
    rows.forEach((row) => {
      const entry = map.get(row.workshopId) ?? { workshop: row.workshop.name, active: 0, critical: 0, high: 0 };
      if (row.status !== "CLOSED" && row.status !== "CANCELED") {
        entry.active += 1;
        if (row.priority === "CRITICAL") entry.critical += 1;
        if (row.priority === "HIGH") entry.high += 1;
      }
      map.set(row.workshopId, entry);
    });
    return Array.from(map.entries())
      .map(([workshopId, x]) => ({
        workshopId,
        workshop: x.workshop,
        active: x.active,
        critical: x.critical,
        high: x.high,
        utilizationScore: Math.min(100, x.active * 8 + x.high * 4 + x.critical * 8)
      }))
      .sort((a, b) => b.utilizationScore - a.utilizationScore);
  }
}
