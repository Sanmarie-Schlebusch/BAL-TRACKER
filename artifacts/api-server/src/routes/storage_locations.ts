import { Router } from "express";
import { db, storageLocationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateStorageLocationBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const locations = await db.select().from(storageLocationsTable).orderBy(storageLocationsTable.name);
  res.json(locations.map(l => ({
    id: l.id,
    name: l.name,
    description: l.description ?? undefined,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateStorageLocationBody.parse(req.body);
  const [location] = await db.insert(storageLocationsTable).values({
    name: body.name,
    description: body.description,
  }).returning();
  res.status(201).json({ id: location.id, name: location.name, description: location.description ?? undefined, createdAt: location.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(storageLocationsTable).where(eq(storageLocationsTable.id, id));
  res.status(204).send();
});

export default router;
