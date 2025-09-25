#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../database/schema.js";
import { PasswordManager } from "../auth/password.js";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

async function createUser(username: string, password: string, isAdmin: boolean = false) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });
  const passwordManager = new PasswordManager(process.env.PASSWORD_PEPPER);

  try {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.username, username),
      columns: {
        id: true,
        username: true
      }
    });

    if (existingUser) {
      console.error(`❌ User with username "${username}" already exists`);
      process.exit(1);
    }

    // Generate salt and hash password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = await passwordManager.hashPassword(password, salt);

    // Insert user
    const [newUser] = await db.insert(schema.user).values({
      username,
      salt,
      password: hashedPassword,
      isAdmin,
    }).returning({
      id: schema.user.id,
      username: schema.user.username,
      isAdmin: schema.user.isAdmin
    });

    console.log(`✅ User created successfully:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Admin: ${newUser.isAdmin ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error("❌ Failed to create user:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function updatePassword(username: string, newPassword: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });
  const passwordManager = new PasswordManager(process.env.PASSWORD_PEPPER);

  try {
    // Find user
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.username, username),
      columns: {
        id: true,
        username: true
      }
    });

    if (!existingUser) {
      console.error(`❌ User with username "${username}" not found`);
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
      .where(eq(schema.user.username, username));

    console.log(`✅ Password updated successfully for: ${username}`);

  } catch (error) {
    console.error("❌ Failed to update password:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function toggleAdmin(username: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Find user
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.username, username),
      columns: {
        id: true,
        username: true,
        isAdmin: true
      }
    });

    if (!existingUser) {
      console.error(`❌ User with username "${username}" not found`);
      process.exit(1);
    }

    // Toggle admin status
    const newAdminStatus = !existingUser.isAdmin;
    await db.update(schema.user)
      .set({ isAdmin: newAdminStatus })
      .where(eq(schema.user.username, username));

    console.log(`✅ Admin status updated for: ${username}`);
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
        username: true,
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
      console.log(`ID: ${user.id} | Username: ${user.username} | Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
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
  console.log("  npm run manage-user create <username> <password> [--admin]");
  console.log("  npm run manage-user password <username> <new-password>");
  console.log("  npm run manage-user toggle-admin <username>");
  console.log("  npm run manage-user list");
  console.log("");
  console.log("Examples:");
  console.log("  npm run manage-user create john mypassword123");
  console.log("  npm run manage-user create admin adminpass --admin");
  console.log("  npm run manage-user password john newpassword456");
  console.log("  npm run manage-user toggle-admin john");
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
      console.error("❌ Create command requires username and password");
      showUsage();
      process.exit(1);
    }
    const [, username, password] = args;
    const isAdmin = args.includes("--admin");

    if (username.length < 3) {
      console.error("❌ Username must be at least 3 characters long");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    createUser(username, password, isAdmin);
    break;

  case "password":
    if (args.length < 3) {
      console.error("❌ Password command requires username and new password");
      showUsage();
      process.exit(1);
    }
    const [, updateUsername, newPassword] = args;

    if (updateUsername.length < 3) {
      console.error("❌ Username must be at least 3 characters long");
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    updatePassword(updateUsername, newPassword);
    break;

  case "toggle-admin":
    if (args.length < 2) {
      console.error("❌ Toggle-admin command requires username");
      showUsage();
      process.exit(1);
    }
    const [, toggleUsername] = args;

    if (toggleUsername.length < 3) {
      console.error("❌ Username must be at least 3 characters long");
      process.exit(1);
    }

    toggleAdmin(toggleUsername);
    break;

  case "list":
    listUsers();
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    showUsage();
    process.exit(1);
}