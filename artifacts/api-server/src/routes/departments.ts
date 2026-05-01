import { Router } from "express";
import { db, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDepartmentBody, UpdateDepartmentBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description ?? undefined,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateDepartmentBody.parse(req.body);
  const [dept] = await db.insert(departmentsTable).values({
    name: body.name,
    description: body.description,
  }).returning();
  res.status(201).json({ id: dept.id, name: dept.name, description: dept.description ?? undefined, createdAt: dept.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!dept) return res.status(404).json({ error: "Not found" });
  res.json({ id: dept.id, name: dept.name, description: dept.description ?? undefined, createdAt: dept.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const body = UpdateDepartmentBody.parse(req.body);
  const [dept] = await db.update(departmentsTable).set({
    name: body.name,
    description: body.description,
  }).where(eq(departmentsTable.id, id)).returning();
  if (!dept) return res.status(404).json({ error: "Not found" });
  res.json({ id: dept.id, name: dept.name, description: dept.description ?? undefined, createdAt: dept.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.status(204).send();
});

export default router;
