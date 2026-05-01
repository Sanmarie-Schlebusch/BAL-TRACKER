import { Router } from "express";
import { db, itemsTable, itemHistoryTable, departmentsTable, marketsTable, seasonsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const { seasonId, marketId } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (seasonId) conditions.push(eq(itemsTable.seasonId, Number(seasonId)));
  if (marketId) conditions.push(eq(itemsTable.marketId, Number(marketId)));

  const items = conditions.length > 0
    ? await db.select().from(itemsTable).where(and(...conditions))
    : await db.select().from(itemsTable);

  const statusMap: Record<string, number> = {};
  for (const item of items) {
    statusMap[item.status] = (statusMap[item.status] ?? 0) + 1;
  }

  const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  const recentActivity = await db.select().from(itemHistoryTable).orderBy(itemHistoryTable.changedAt).limit(10);

  res.json({
    totalItems: items.length,
    missingItems: statusMap["Missing"] ?? 0,
    damagedItems: statusMap["Damaged"] ?? 0,
    reusableItems: items.filter(i => i.reusable).length,
    onSiteItems: statusMap["On Site"] ?? 0,
    packedItems: statusMap["Packed"] ?? 0,
    inTransitItems: statusMap["In Transit"] ?? 0,
    neededItems: statusMap["Needed"] ?? 0,
    storedItems: statusMap["Stored"] ?? 0,
    returnedItems: statusMap["Returned"] ?? 0,
    installedItems: statusMap["Installed"] ?? 0,
    statusBreakdown,
    recentActivity: recentActivity.map(h => ({
      id: h.id,
      itemId: h.itemId,
      field: h.field,
      oldValue: h.oldValue ?? undefined,
      newValue: h.newValue,
      changedBy: h.changedBy ?? undefined,
      changedAt: h.changedAt.toISOString(),
    })),
  });
});

router.get("/market-comparison", async (req, res) => {
  const { seasonId } = req.query as Record<string, string>;
  if (!seasonId) return res.status(400).json({ error: "seasonId required" });

  const items = await db.select().from(itemsTable).where(eq(itemsTable.seasonId, Number(seasonId)));
  const markets = await db.select().from(marketsTable).orderBy(marketsTable.name);
  const depts = await db.select().from(departmentsTable);
  const deptMap = new Map(depts.map(d => [d.id, d.name]));

  const rowMap = new Map<string, {
    itemName: string;
    departmentName: string;
    unitType: string;
    reusable: boolean;
    markets: Map<number, { marketId: number; marketName: string; plannedQuantity: number; actualQuantity: number; status: string }>;
  }>();

  for (const item of items) {
    const key = `${item.name}__${item.departmentId}__${item.unitType}`;
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        itemName: item.name,
        departmentName: deptMap.get(item.departmentId) ?? "Unknown",
        unitType: item.unitType,
        reusable: item.reusable,
        markets: new Map(),
      });
    }
    const row = rowMap.get(key)!;
    const market = markets.find(m => m.id === item.marketId);
    if (market) {
      row.markets.set(market.id, {
        marketId: market.id,
        marketName: market.name,
        plannedQuantity: item.plannedQuantity,
        actualQuantity: item.actualQuantity,
        status: item.status,
      });
    }
  }

  const result = Array.from(rowMap.values()).map(row => ({
    itemName: row.itemName,
    departmentName: row.departmentName,
    unitType: row.unitType,
    reusable: row.reusable,
    markets: markets.map(m => row.markets.get(m.id) ?? {
      marketId: m.id,
      marketName: m.name,
      plannedQuantity: 0,
      actualQuantity: 0,
      status: "Needed",
    }),
  }));

  res.json(result);
});

router.get("/department-breakdown", async (req, res) => {
  const { seasonId, marketId } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (seasonId) conditions.push(eq(itemsTable.seasonId, Number(seasonId)));
  if (marketId) conditions.push(eq(itemsTable.marketId, Number(marketId)));

  const items = conditions.length > 0
    ? await db.select().from(itemsTable).where(and(...conditions))
    : await db.select().from(itemsTable);

  const depts = await db.select().from(departmentsTable);

  const breakdown = depts.map(dept => {
    const deptItems = items.filter(i => i.departmentId === dept.id);
    const statusMap: Record<string, number> = {};
    for (const item of deptItems) {
      statusMap[item.status] = (statusMap[item.status] ?? 0) + 1;
    }
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalItems: deptItems.length,
      missingItems: statusMap["Missing"] ?? 0,
      damagedItems: statusMap["Damaged"] ?? 0,
      onSiteItems: statusMap["On Site"] ?? 0,
      statusCounts: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    };
  });

  res.json(breakdown);
});

export default router;
