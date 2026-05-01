import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";

export const itemHistoryTable = pgTable("item_history", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changedBy: text("changed_by"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemHistorySchema = createInsertSchema(itemHistoryTable).omit({ id: true, changedAt: true });
export type InsertItemHistory = z.infer<typeof insertItemHistorySchema>;
export type ItemHistory = typeof itemHistoryTable.$inferSelect;
