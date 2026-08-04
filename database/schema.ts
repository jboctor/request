import { integer, pgTable, varchar, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  salt: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isAdmin: boolean().notNull().default(false),
  dateDeleted: timestamp(),
});

export const requestMediaTypeEnum = pgEnum('request_media_type', ['Audio Book', 'Book', 'Movie', 'TV Show', 'Site Suggestion']);

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

export const newFeature = pgTable("new_feature", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  page: varchar({ length: 255 }).notNull(),
  selector: varchar({ length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 1000 }).notNull(),
  dateCreated: timestamp().notNull().defaultNow(),
  isActive: boolean().notNull().default(true),
  displayOrder: integer().notNull().default(0),
});

export const userFeatureDismissal = pgTable("user_feature_dismissal", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => user.id),
  featureId: integer().notNull().references(() => newFeature.id),
  dateDismissed: timestamp().notNull().defaultNow(),
});

export const oauthConfig = pgTable("oauth_config", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  providerName: varchar({ length: 255 }).notNull().default("OAuth"),
  clientId: varchar({ length: 500 }).notNull(),
  clientSecret: varchar({ length: 500 }).notNull(),
  authorizationUrl: varchar({ length: 1000 }).notNull(),
  tokenUrl: varchar({ length: 1000 }).notNull(),
  userInfoUrl: varchar({ length: 1000 }).notNull(),
  scopes: varchar({ length: 500 }).notNull().default("openid email profile"),
  usernameClaim: varchar({ length: 255 }).notNull().default("email"),
  enabled: boolean().notNull().default(false),
  autoCreateUsers: boolean().notNull().default(false),
  dateCreated: timestamp().notNull().defaultNow(),
  dateUpdated: timestamp(),
});

export const userEmail = pgTable("user_email", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => user.id).unique(),
  email: varchar({ length: 255 }).notNull(),
  allowNotifications: boolean().notNull().default(false),
  isVerified: boolean().notNull().default(false),
  verificationToken: varchar({ length: 64 }),
  verificationTokenExpiry: timestamp(),
  dateCreated: timestamp().notNull().defaultNow(),
  dateUpdated: timestamp(),
});
