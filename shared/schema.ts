import { z } from "zod";

// Pure frontend app - no database needed
// These types define the ASCII editor's data model

export const cellSchema = z.object({
  char: z.string().max(1),
  fg: z.string().optional(),
  bg: z.string().optional(),
});

export type Cell = z.infer<typeof cellSchema>;

export const layerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  opacity: z.number().min(0).max(1),
  cells: z.array(z.array(cellSchema)),
});

export type Layer = z.infer<typeof layerSchema>;

export const projectSchema = z.object({
  width: z.number().min(1).max(200),
  height: z.number().min(1).max(200),
  layers: z.array(layerSchema),
  activeLayerId: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

// Keep user schema for template compatibility
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
