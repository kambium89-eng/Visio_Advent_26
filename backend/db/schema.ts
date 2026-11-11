import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const prideResponses = sqliteTable("pride_responses", {
  id: text("id").primaryKey(),
  answersJson: text("answers_json").notNull(),
  savedAt: text("saved_at").notNull(),
});
export const loginAttempts = sqliteTable("login_attempts", {
  id: text("id").primaryKey(),
  window: integer("window").notNull(),
  attempts: integer("attempts").notNull().default(0),
});
