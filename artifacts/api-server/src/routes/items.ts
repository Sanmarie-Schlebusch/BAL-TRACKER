import { Router } from "express";
import { db, itemsTable, itemPhotosTable, itemHistoryTable, seasonsTable, marketsTable, departmentsTable, suppliersTable, storageLocationsTable } from "@workspace/db";
import { eq, and, ilike, SQL } from "drizzle-orm";
import { CreateItemBody, UpdateItemBody, DuplicateItemBody, AddItemPhotoBody, BulkImportItemsBody } from "@workspace/api-zod";

const router = Router();

function toItemResponse(item: typeof itemsTable.$inferSelect, deps: {
  departmentName?: string;
  seasonLabel?: string;
  marketName?: string;
  supplierName?: string;
  storageLocationName?: string;
}) {
  return {
    id: item.id,
    name: item.name,
    departmentId: item.departmentId,
    departmentName: deps.departmentName,
    seasonId: item.seasonId,
    seasonLabel: deps.seasonLabel,
    marketId: item.marketId,
    marketName: deps.marketName,
    plannedQuantity: item.plannedQuantity,
    actualQuantity: item.actualQuantity,
    unitType: item.unitType,
    status: item.status,
    condition: item.condition,
    reusable: item.reusable,
    isGeneric: item.isGeneric,
    supplierId: item.supplierId ?? undefined,
    supplierName: deps.supplierName,
    storageLocationId: item.storageLocationId ?? undefined,
    storageLocationName: deps.storageLocationName,
    notes: item.notes ?? undefined,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    lastUpdatedAt: item.lastUpdatedAt.toISOString(),
    updatedBy: item.updatedBy ?? undefined,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { seasonId, marketId, departmentId, supplierId, status, condition, reusable, search } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (seasonId) conditions.push(eq(itemsTable.seasonId, Number(seasonId)));
  if (marketId) conditions.push(eq(itemsTable.marketId, Number(marketId)));
  if (departmentId) conditions.push(eq(itemsTable.departmentId, Number(departmentId)));
  if (supplierId) conditions.push(eq(itemsTable.supplierId, Number(supplierId)));
  if (status) conditions.push(eq(itemsTable.status, status));
  if (condition) conditions.push(eq(itemsTable.condition, condition));
  if (reusable !== undefined && reusable !== "") conditions.push(eq(itemsTable.reusable, reusable === "true"));
  if (search) conditions.push(ilike(itemsTable.name, `%${search}%`));

  const query = conditions.length > 0
    ? db.select().from(itemsTable).where(and(...conditions))
    : db.select().from(itemsTable);

  const items = await query.orderBy(itemsTable.name);

  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));
  const supplierMap = new Map((await db.select().from(suppliersTable)).map(s => [s.id, s.name]));
  const storageMap = new Map((await db.select().from(storageLocationsTable)).map(l => [l.id, l.name]));

  res.json(items.map(item => toItemResponse(item, {
    departmentName: deptMap.get(item.departmentId),
    seasonLabel: seasonMap.get(item.seasonId),
    marketName: marketMap.get(item.marketId),
    supplierName: item.supplierId ? supplierMap.get(item.supplierId) : undefined,
    storageLocationName: item.storageLocationId ? storageMap.get(item.storageLocationId) : undefined,
  })));
});

router.post("/bulk-import", async (req, res) => {
  const body = BulkImportItemsBody.parse(req.body);
  const lines = body.csvData.trim().split("\n");
  const headers = lines[0]?.split(",").map(h => h.trim().toLowerCase()) ?? [];

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

    const depts = await db.select().from(departmentsTable);
    const deptName = row["department"] ?? "";
    let dept = depts.find(d => d.name.toLowerCase() === deptName.toLowerCase());
    if (!dept && deptName) {
      const [newDept] = await db.insert(departmentsTable).values({ name: deptName }).returning();
      dept = newDept;
    }

    try {
      await db.insert(itemsTable).values({
        name: row["name"] || `Item ${i}`,
        departmentId: dept?.id ?? 1,
        seasonId: body.seasonId,
        marketId: body.marketId,
        plannedQuantity: parseInt(row["planned_quantity"] || row["quantity"] || "0") || 0,
        actualQuantity: parseInt(row["actual_quantity"] || "0") || 0,
        unitType: row["unit_type"] || "item",
        status: row["status"] || "Needed",
        condition: row["condition"] || "Good",
        reusable: row["reusable"]?.toLowerCase() === "yes" || row["reusable"] === "true",
        isGeneric: row["is_generic"]?.toLowerCase() !== "no" && row["is_generic"] !== "false",
        notes: row["notes"] || null,
      });
      imported++;
    } catch (e) {
      errors.push(`Row ${i}: ${String(e)}`);
    }
  }

  res.json({ imported, failed: errors.length, errors });
});

router.post("/", async (req, res) => {
  const body = CreateItemBody.parse(req.body);
  const [item] = await db.insert(itemsTable).values({
    name: body.name,
    departmentId: body.departmentId,
    seasonId: body.seasonId,
    marketId: body.marketId,
    plannedQuantity: body.plannedQuantity,
    actualQuantity: body.actualQuantity,
    unitType: body.unitType,
    status: body.status || "Needed",
    condition: body.condition || "Good",
    reusable: body.reusable,
    isGeneric: body.isGeneric,
    supplierId: body.supplierId ?? null,
    storageLocationId: body.storageLocationId ?? null,
    notes: body.notes ?? null,
    updatedBy: body.updatedBy ?? null,
  }).returning();

  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));
  const supplierMap = new Map((await db.select().from(suppliersTable)).map(s => [s.id, s.name]));
  const storageMap = new Map((await db.select().from(storageLocationsTable)).map(l => [l.id, l.name]));

  res.status(201).json(toItemResponse(item, {
    departmentName: deptMap.get(item.departmentId),
    seasonLabel: seasonMap.get(item.seasonId),
    marketName: marketMap.get(item.marketId),
    supplierName: item.supplierId ? supplierMap.get(item.supplierId) : undefined,
    storageLocationName: item.storageLocationId ? storageMap.get(item.storageLocationId) : undefined,
  }));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!item) return res.status(404).json({ error: "Not found" });

  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));
  const supplierMap = new Map((await db.select().from(suppliersTable)).map(s => [s.id, s.name]));
  const storageMap = new Map((await db.select().from(storageLocationsTable)).map(l => [l.id, l.name]));

  const photos = await db.select().from(itemPhotosTable).where(eq(itemPhotosTable.itemId, id)).orderBy(itemPhotosTable.createdAt);
  const history = await db.select().from(itemHistoryTable).where(eq(itemHistoryTable.itemId, id)).orderBy(itemHistoryTable.changedAt);

  res.json({
    ...toItemResponse(item, {
      departmentName: deptMap.get(item.departmentId),
      seasonLabel: seasonMap.get(item.seasonId),
      marketName: marketMap.get(item.marketId),
      supplierName: item.supplierId ? supplierMap.get(item.supplierId) : undefined,
      storageLocationName: item.storageLocationId ? storageMap.get(item.storageLocationId) : undefined,
    }),
    photos: photos.map(p => ({ id: p.id, itemId: p.itemId, url: p.url, caption: p.caption ?? undefined, photoType: p.photoType ?? undefined, createdAt: p.createdAt.toISOString() })),
    history: history.map(h => ({ id: h.id, itemId: h.itemId, field: h.field, oldValue: h.oldValue ?? undefined, newValue: h.newValue, changedBy: h.changedBy ?? undefined, changedAt: h.changedAt.toISOString() })),
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = UpdateItemBody.parse(req.body);

  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updates: Partial<typeof itemsTable.$inferInsert> = {};
  const historyEntries: { field: string; oldValue: string | null; newValue: string }[] = [];

  const trackField = <K extends keyof typeof existing>(field: K, dbField: keyof typeof itemsTable.$inferInsert, newVal: typeof existing[K] | undefined) => {
    if (newVal !== undefined && newVal !== existing[field]) {
      (updates as Record<string, unknown>)[dbField as string] = newVal;
      historyEntries.push({ field: String(field), oldValue: String(existing[field]), newValue: String(newVal) });
    }
  };

  trackField("name", "name", body.name);
  trackField("departmentId", "departmentId", body.departmentId);
  trackField("seasonId", "seasonId", body.seasonId);
  trackField("marketId", "marketId", body.marketId);
  trackField("plannedQuantity", "plannedQuantity", body.plannedQuantity);
  trackField("actualQuantity", "actualQuantity", body.actualQuantity);
  trackField("unitType", "unitType", body.unitType);
  trackField("status", "status", body.status);
  trackField("condition", "condition", body.condition);
  trackField("reusable", "reusable", body.reusable);
  trackField("isGeneric", "isGeneric", body.isGeneric);
  trackField("supplierId", "supplierId", body.supplierId ?? undefined);
  trackField("storageLocationId", "storageLocationId", body.storageLocationId ?? undefined);
  trackField("notes", "notes", body.notes ?? undefined);
  if (body.updatedBy !== undefined) updates.updatedBy = body.updatedBy;

  if (Object.keys(updates).length > 0) {
    updates.lastUpdatedAt = new Date();
    await db.update(itemsTable).set(updates).where(eq(itemsTable.id, id));

    if (historyEntries.length > 0) {
      await db.insert(itemHistoryTable).values(historyEntries.map(e => ({
        itemId: id,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
        changedBy: body.updatedBy ?? null,
      })));
    }
  }

  const [updated] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));
  const supplierMap = new Map((await db.select().from(suppliersTable)).map(s => [s.id, s.name]));
  const storageMap = new Map((await db.select().from(storageLocationsTable)).map(l => [l.id, l.name]));

  res.json(toItemResponse(updated, {
    departmentName: deptMap.get(updated.departmentId),
    seasonLabel: seasonMap.get(updated.seasonId),
    marketName: marketMap.get(updated.marketId),
    supplierName: updated.supplierId ? supplierMap.get(updated.supplierId) : undefined,
    storageLocationName: updated.storageLocationId ? storageMap.get(updated.storageLocationId) : undefined,
  }));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(itemsTable).where(eq(itemsTable.id, id));
  res.status(204).send();
});

router.post("/:id/duplicate", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = DuplicateItemBody.parse(req.body);

  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const [newItem] = await db.insert(itemsTable).values({
    name: existing.name,
    departmentId: existing.departmentId,
    seasonId: body.targetSeasonId,
    marketId: body.targetMarketId,
    plannedQuantity: existing.plannedQuantity,
    actualQuantity: 0,
    unitType: existing.unitType,
    status: "Needed",
    condition: existing.condition,
    reusable: existing.reusable,
    isGeneric: existing.isGeneric,
    supplierId: existing.supplierId,
    storageLocationId: existing.storageLocationId,
    notes: existing.notes,
    updatedBy: null,
  }).returning();

  const deptMap = new Map((await db.select().from(departmentsTable)).map(d => [d.id, d.name]));
  const seasonMap = new Map((await db.select().from(seasonsTable)).map(s => [s.id, s.label]));
  const marketMap = new Map((await db.select().from(marketsTable)).map(m => [m.id, m.name]));
  const supplierMap = new Map((await db.select().from(suppliersTable)).map(s => [s.id, s.name]));
  const storageMap = new Map((await db.select().from(storageLocationsTable)).map(l => [l.id, l.name]));

  res.status(201).json(toItemResponse(newItem, {
    departmentName: deptMap.get(newItem.departmentId),
    seasonLabel: seasonMap.get(newItem.seasonId),
    marketName: marketMap.get(newItem.marketId),
    supplierName: newItem.supplierId ? supplierMap.get(newItem.supplierId) : undefined,
    storageLocationName: newItem.storageLocationId ? storageMap.get(newItem.storageLocationId) : undefined,
  }));
});

router.post("/:id/photos", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = AddItemPhotoBody.parse(req.body);
  const [photo] = await db.insert(itemPhotosTable).values({
    itemId: id,
    url: body.url,
    caption: body.caption ?? null,
    photoType: body.photoType ?? null,
  }).returning();

  const firstPhoto = await db.select().from(itemPhotosTable).where(eq(itemPhotosTable.itemId, id)).orderBy(itemPhotosTable.createdAt).limit(1);
  if (firstPhoto.length === 1 && firstPhoto[0]?.id === photo.id) {
    await db.update(itemsTable).set({ thumbnailUrl: photo.url }).where(eq(itemsTable.id, id));
  }

  res.status(201).json({ id: photo.id, itemId: photo.itemId, url: photo.url, caption: photo.caption ?? undefined, photoType: photo.photoType ?? undefined, createdAt: photo.createdAt.toISOString() });
});

router.delete("/:id/photos/:photoId", async (req, res) => {
  const photoId = Number(req.params["photoId"]);
  await db.delete(itemPhotosTable).where(eq(itemPhotosTable.id, photoId));
  res.status(204).send();
});

router.get("/:id/history", async (req, res) => {
  const id = Number(req.params["id"]);
  const history = await db.select().from(itemHistoryTable).where(eq(itemHistoryTable.itemId, id)).orderBy(itemHistoryTable.changedAt);
  res.json(history.map(h => ({ id: h.id, itemId: h.itemId, field: h.field, oldValue: h.oldValue ?? undefined, newValue: h.newValue, changedBy: h.changedBy ?? undefined, changedAt: h.changedAt.toISOString() })));
});

export default router;
