import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSupplierBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers.map(s => ({
    id: s.id,
    name: s.name,
    contact: s.contact ?? undefined,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateSupplierBody.parse(req.body);
  const [supplier] = await db.insert(suppliersTable).values({
    name: body.name,
    contact: body.contact,
  }).returning();
  res.status(201).json({ id: supplier.id, name: supplier.name, contact: supplier.contact ?? undefined, createdAt: supplier.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
  res.status(204).send();
});

export default router;
