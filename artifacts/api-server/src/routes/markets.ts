import { Router } from "express";
import { db, marketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMarketBody, UpdateMarketBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const markets = await db.select().from(marketsTable).orderBy(marketsTable.name);
  res.json(markets.map(m => ({
    id: m.id,
    name: m.name,
    country: m.country,
    region: m.region ?? undefined,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateMarketBody.parse(req.body);
  const [market] = await db.insert(marketsTable).values({
    name: body.name,
    country: body.country,
    region: body.region,
  }).returning();
  res.status(201).json({ id: market.id, name: market.name, country: market.country, region: market.region ?? undefined, createdAt: market.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, id));
  if (!market) return res.status(404).json({ error: "Not found" });
  res.json({ id: market.id, name: market.name, country: market.country, region: market.region ?? undefined, createdAt: market.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = UpdateMarketBody.parse(req.body);
  const [market] = await db.update(marketsTable).set({
    name: body.name,
    country: body.country,
    region: body.region,
  }).where(eq(marketsTable.id, id)).returning();
  if (!market) return res.status(404).json({ error: "Not found" });
  res.json({ id: market.id, name: market.name, country: market.country, region: market.region ?? undefined, createdAt: market.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(marketsTable).where(eq(marketsTable.id, id));
  res.status(204).send();
});

export default router;
