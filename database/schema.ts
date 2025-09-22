import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  salt: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
});
