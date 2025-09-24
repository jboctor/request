#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/database/schema.js";
import { PasswordManager } from "~/auth/password.js";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

async function createUser(email: string, password: string, isAdmin: boolean = false) {
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
      isAdmin,
    }).returning({
      id: schema.user.id,
      email: schema.user.email,
      isAdmin: schema.user.isAdmin
    });

    console.log(`✅ User created successfully:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Admin: ${newUser.isAdmin ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error("❌ Failed to create user:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function updatePassword(email: string, newPassword: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });
  const passwordManager = new PasswordManager();

  try {
    // Find user
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
      columns: {
        id: true,
        email: true
      }
    });

    if (!existingUser) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Generate new salt and hash password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = await passwordManager.hashPassword(newPassword, salt);

    // Update user password
    await db.update(schema.user)
      .set({
        salt,
        password: hashedPassword
      })
      .where(eq(schema.user.email, email));

    console.log(`✅ Password updated successfully for: ${email}`);

  } catch (error) {
    console.error("❌ Failed to update password:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function toggleAdmin(email: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Find user
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
      columns: {
        id: true,
        email: true,
        isAdmin: true
      }
    });

    if (!existingUser) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Toggle admin status
    const newAdminStatus = !existingUser.isAdmin;
    await db.update(schema.user)
      .set({ isAdmin: newAdminStatus })
      .where(eq(schema.user.email, email));

    console.log(`✅ Admin status updated for: ${email}`);
    console.log(`   Admin: ${newAdminStatus ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error("❌ Failed to toggle admin status:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function listUsers() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    const users = await db.query.user.findMany({
      columns: {
        id: true,
        email: true,
        isAdmin: true
      },
      orderBy: schema.user.id
    });

    if (users.length === 0) {
      console.log("No users found.");
      return;
    }

    console.log("\n📋 All Users:");
    console.log("═".repeat(60));
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
    });
    console.log("═".repeat(60));

  } catch (error) {
    console.error("❌ Failed to list users:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

function showUsage() {
  console.log("User Management Script");
  console.log("Usage:");
  console.log("  npm run manage-user create <email> <password> [--admin]");
  console.log("  npm run manage-user password <email> <new-password>");
  console.log("  npm run manage-user toggle-admin <email>");
  console.log("  npm run manage-user list");
  console.log("");
  console.log("Examples:");
  console.log("  npm run manage-user create user@example.com mypassword123");
  console.log("  npm run manage-user create admin@example.com adminpass --admin");
  console.log("  npm run manage-user password user@example.com newpassword456");
  console.log("  npm run manage-user toggle-admin user@example.com");
  console.log("  npm run manage-user list");
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  process.exit(1);
}

const command = args[0];

switch (command) {
  case "create":
    if (args.length < 3) {
      console.error("❌ Create command requires email and password");
      showUsage();
      process.exit(1);
    }
    const [, email, password] = args;
    const isAdmin = args.includes("--admin");

    if (!email.includes("@")) {
      console.error("❌ Please provide a valid email address");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    createUser(email, password, isAdmin);
    break;

  case "password":
    if (args.length < 3) {
      console.error("❌ Password command requires email and new password");
      showUsage();
      process.exit(1);
    }
    const [, updateEmail, newPassword] = args;

    if (!updateEmail.includes("@")) {
      console.error("❌ Please provide a valid email address");
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    updatePassword(updateEmail, newPassword);
    break;

  case "toggle-admin":
    if (args.length < 2) {
      console.error("❌ Toggle-admin command requires email");
      showUsage();
      process.exit(1);
    }
    const [, toggleEmail] = args;

    if (!toggleEmail.includes("@")) {
      console.error("❌ Please provide a valid email address");
      process.exit(1);
    }

    toggleAdmin(toggleEmail);
    break;

  case "list":
    listUsers();
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    showUsage();
    process.exit(1);
}