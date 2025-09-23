import { integer, pgTable, varchar, pgEnum, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  salt: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull().default(false),
});

export const requestMediaTypeEnum = pgEnum('request_media_type', ['book', 'movie', 'tv-show']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'completed']);

export const request = pgTable("request", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => user.id),
  mediaType: requestMediaTypeEnum().notNull(),
  title: varchar({ length: 255 }).notNull(),
  status: requestStatusEnum().notNull().default("pending"),
});
