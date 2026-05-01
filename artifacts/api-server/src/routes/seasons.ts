import { Router } from "express";
import { db, seasonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSeasonBody, UpdateSeasonBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const seasons = await db.select().from(seasonsTable).orderBy(seasonsTable.year);
  res.json(seasons.map(s => ({
    id: s.id,
    year: s.year,
    label: s.label,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateSeasonBody.parse(req.body);
  const [season] = await db.insert(seasonsTable).values({
    year: body.year,
    label: body.label,
    isActive: body.isActive ?? false,
  }).returning();
  res.status(201).json({ id: season.id, year: season.year, label: season.label, isActive: season.isActive, createdAt: season.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [season] = await db.select().from(seasonsTable).where(eq(seasonsTable.id, id));
  if (!season) return res.status(404).json({ error: "Not found" });
  res.json({ id: season.id, year: season.year, label: season.label, isActive: season.isActive, createdAt: season.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = UpdateSeasonBody.parse(req.body);
  const [season] = await db.update(seasonsTable).set({
    year: body.year,
    label: body.label,
    isActive: body.isActive ?? false,
  }).where(eq(seasonsTable.id, id)).returning();
  if (!season) return res.status(404).json({ error: "Not found" });
  res.json({ id: season.id, year: season.year, label: season.label, isActive: season.isActive, createdAt: season.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(seasonsTable).where(eq(seasonsTable.id, id));
  res.status(204).send();
});

export default router;
