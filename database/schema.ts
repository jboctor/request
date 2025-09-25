import { integer, pgTable, varchar, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  salt: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull().default(false),
});

export const requestMediaTypeEnum = pgEnum('request_media_type', ['Book', 'Movie', 'TV Show']);

export const request = pgTable("request", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => user.id),
  mediaType: requestMediaTypeEnum().notNull(),
  title: varchar({ length: 255 }).notNull(),
  dateCreated: timestamp().notNull().defaultNow(),
  dateCompleted: timestamp(),
  dateDeleted: timestamp(),
  notes: varchar({ length: 500 }),
});
