import { Router } from "express";
import { db, itemsTable, seasonsTable, marketsTable, departmentsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";

const router = Router();

router.get("/export", async (req, res) => {
  const { seasonId, marketId, departmentId, reportType } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (seasonId) conditions.push(eq(itemsTable.seasonId, Number(seasonId)));
  if (marketId) conditions.push(eq(itemsTable.marketId, Number(marketId)));
  if (departmentId) conditions.push(eq(itemsTable.departmentId, Number(departmentId)));

  let items = conditions.length > 0
    ? await db.select().from(itemsTable).where(and(...conditions))
    : await db.select().from(itemsTable);

  if (reportType === "damaged_missing") {
    items = items.filter(i => i.status === "Damaged" || i.status === "Missing");
  } else if (reportType === "reusable") {
    items = items.filter(i => i.reusable);
  } else if (reportType === "load_out") {
    items = items.filter(i => ["On Site", "Installed", "Stored"].includes(i.status));
  } else if (reportType === "storage") {
    items = items.filter(i => i.status === "Stored");
  }

  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));

  const headers = ["ID", "Name", "Department", "Season", "Market", "Planned Qty", "Actual Qty", "Unit", "Status", "Condition", "Reusable", "Generic", "Notes", "Updated By", "Last Updated"];
  const rows = items.map(item => [
    item.id,
    item.name,
    deptMap.get(item.departmentId) ?? "",
    seasonMap.get(item.seasonId) ?? "",
    marketMap.get(item.marketId) ?? "",
    item.plannedQuantity,
    item.actualQuantity,
    item.unitType,
    item.status,
    item.condition,
    item.reusable ? "Yes" : "No",
    item.isGeneric ? "Generic" : "Market-Specific",
    (item.notes ?? "").replace(/,/g, ";"),
    item.updatedBy ?? "",
    item.lastUpdatedAt.toISOString(),
  ]);

  const csvData = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  const type = reportType || "full";
  const marketName = marketId ? (marketMap.get(Number(marketId)) ?? "all") : "all";
  const seasonLabel = seasonId ? (seasonMap.get(Number(seasonId)) ?? "all") : "all";
  const filename = `BAL_${type}_${marketName}_${seasonLabel}.csv`;

  res.json({ csvData, filename, rowCount: items.length });
});

export default router;
