import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";

export const itemPhotosTable = pgTable("item_photos", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  photoType: text("photo_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemPhotoSchema = createInsertSchema(itemPhotosTable).omit({ id: true, createdAt: true });
export type InsertItemPhoto = z.infer<typeof insertItemPhotoSchema>;
export type ItemPhoto = typeof itemPhotosTable.$inferSelect;
