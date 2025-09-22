#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../database/schema.js";
import { PasswordManager } from "../auth/password.js";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

async function createUser(email: string, password: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });
  const passwordManager = new PasswordManager();

  try {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
      columns: {
        id: true,
        email: true
      }
    });

    if (existingUser) {
      console.error(`❌ User with email "${email}" already exists`);
      process.exit(1);
    }

    // Generate salt and hash password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = await passwordManager.hashPassword(password, salt);

    // Insert user
    const [newUser] = await db.insert(schema.user).values({
      email,
      salt,
      password: hashedPassword,
    }).returning({
      id: schema.user.id,
      email: schema.user.email
    });

    console.log(`✅ User created successfully:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);

  } catch (error) {
    console.error("❌ Failed to create user:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: npm run create-user <email> <password>");
  console.log("Example: npm run create-user user@example.com mypassword123");
  process.exit(1);
}

const [email, password] = args;

if (!email.includes("@")) {
  console.error("❌ Please provide a valid email address");
  process.exit(1);
}

if (password.length < 6) {
  console.error("❌ Password must be at least 6 characters long");
  process.exit(1);
}

createUser(email, password);