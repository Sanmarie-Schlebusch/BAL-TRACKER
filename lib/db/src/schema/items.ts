import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { seasonsTable } from "./seasons";
import { marketsTable } from "./markets";
import { departmentsTable } from "./departments";
import { suppliersTable } from "./suppliers";
import { storageLocationsTable } from "./storage_locations";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull().references(() => departmentsTable.id),
  seasonId: integer("season_id").notNull().references(() => seasonsTable.id),
  marketId: integer("market_id").notNull().references(() => marketsTable.id),
  plannedQuantity: integer("planned_quantity").notNull().default(0),
  actualQuantity: integer("actual_quantity").notNull().default(0),
  unitType: text("unit_type").notNull().default("item"),
  status: text("status").notNull().default("Needed"),
  condition: text("condition").notNull().default("Good"),
  reusable: boolean("reusable").notNull().default(false),
  isGeneric: boolean("is_generic").notNull().default(true),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  storageLocationId: integer("storage_location_id").references(() => storageLocationsTable.id),
  notes: text("notes"),
  thumbnailUrl: text("thumbnail_url"),
  updatedBy: text("updated_by"),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true, lastUpdatedAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
