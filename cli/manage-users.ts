import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { DatabaseContext } from "~/database/context";
import * as schema from "~/database/schema";

const USAGE = `Usage: npm run cli -- <command> [options]

Commands:
  list                              List all users
  create <username> <password> [--admin]  Create a new user
  delete <username>                 Soft-delete a user
  make-admin <username>             Make a user an admin`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !["list", "create", "delete", "make-admin"].includes(command)) {
    console.log(USAGE);
    process.exit(command ? 1 : 0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  await DatabaseContext.run(db, async () => {
    // Dynamic import so UserService's static db field resolves within the context
    const { UserService } = await import("~/services/userService");

    switch (command) {
      case "list": {
        const users = await UserService.getAllUsers();
        if (users.length === 0) {
          console.log("No users found.");
          break;
        }
        console.log(
          "ID".padEnd(6) +
          "Username".padEnd(20) +
          "Admin".padEnd(8) +
          "Status"
        );
        console.log("-".repeat(46));
        for (const user of users) {
          console.log(
            String(user.id).padEnd(6) +
            user.username.padEnd(20) +
            (user.isAdmin ? "yes" : "no").padEnd(8) +
            (user.dateDeleted ? "deleted" : "active")
          );
        }
        break;
      }

      case "create": {
        const username = args[1];
        const password = args[2];
        const isAdmin = args.includes("--admin");

        if (!username || !password) {
          console.error("Usage: npm run cli -- create <username> <password> [--admin]");
          process.exit(1);
        }

        const validation = UserService.validatePassword(password);
        if (!validation.isValid) {
          console.error(`Error: ${validation.error}`);
          process.exit(1);
        }

        const newUser = await UserService.createUser({ username, password, isAdmin });
        console.log(`Created user "${newUser.username}" (id: ${newUser.id})${isAdmin ? " as admin" : ""}`);
        break;
      }

      case "delete": {
        const username = args[1];
        if (!username) {
          console.error("Usage: npm run cli -- delete <username>");
          process.exit(1);
        }

        const user = await UserService.getUserByUsername(username);
        if (!user) {
          console.error(`Error: User "${username}" not found`);
          process.exit(1);
        }
        if (user.dateDeleted) {
          console.error(`Error: User "${username}" is already deleted`);
          process.exit(1);
        }

        await UserService.deleteUser(user.id);
        console.log(`Deleted user "${username}"`);
        break;
      }

      case "make-admin": {
        const username = args[1];
        if (!username) {
          console.error("Usage: npm run cli -- make-admin <username>");
          process.exit(1);
        }

        const user = await UserService.getUserByUsername(username);
        if (!user) {
          console.error(`Error: User "${username}" not found`);
          process.exit(1);
        }
        if (user.isAdmin) {
          console.log(`User "${username}" is already an admin`);
          break;
        }

        await UserService.toggleAdminStatus(user.id);
        console.log(`User "${username}" is now an admin`);
        break;
      }
    }
  });

  await client.end();
}

main().catch((err) => {
  console.error(`Error: ${err.cause?.message ?? err.message}`);
  process.exit(1);
});
