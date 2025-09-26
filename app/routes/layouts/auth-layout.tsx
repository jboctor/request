import type { Route } from "./+types/auth-layout";
import { Outlet, Form, redirect } from "react-router";
import { Button } from "~/components/Button";
import { Navigation } from "~/components/Navigation";
import { database } from "~/database/context";

function checkAuth(args?: Route.LoaderArgs) {
  const user = args?.context?.session?.user;
  if (user?.id && user?.username) {
    return { id: user.id, username: user.username, isAdmin: user.isAdmin ?? false };
  }
  return null;
}

export async function loader(args: Route.LoaderArgs) {
  const sessionUser = checkAuth(args);

  if (!sessionUser) {
    return redirect("/");
  }

  const now = Date.now();
  const lastValidated = args.context.session.lastValidated || 0;
  const validationInterval = 5 * 60 * 1000; // 5 minutes
  const needsValidation = (now - lastValidated) > validationInterval;

  if (needsValidation) {
    try {
      const db = database();
      const dbUser = await db.query.user.findFirst({
        where: (fields, operators) => operators.eq(fields.id, sessionUser.id),
        columns: {
          id: true,
          username: true,
          isAdmin: true,
          dateDeleted: true
        },
      });

      if (!dbUser || dbUser.dateDeleted) {
        // User has been deleted, destroy session and redirect to login
        args.context.session.destroy(() => {});
        return redirect("/");
      }

      // Update session with current user data and validation timestamp
      args.context.session.user = {
        id: dbUser.id,
        username: dbUser.username,
        isAdmin: dbUser.isAdmin
      };
      args.context.session.lastValidated = now;

      // Save session with updated data
      await new Promise<void>((resolve, reject) => {
        args.context.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return { user: args.context.session.user };
    } catch (error) {
      console.error("Error verifying user session:", error);
      return redirect("/");
    }
  }

  // Use cached session data (no DB query needed)
  return { user: sessionUser };
}

export default function AuthLayout({
  loaderData
}: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div>
      {/* Desktop: Single row layout (sticky entire header) */}
      <header className="hidden md:block sticky top-0 z-10 bg-green-100 dark:bg-green-900 p-4 border-b border-green-300 dark:border-green-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-green-800 dark:text-white">
              Logged in: {user.username}
            </span>
            {user.isAdmin && <Navigation />}
          </div>
          <Form method="post" action="/logout">
            <Button
              type="submit"
              variant="secondary"
            >
              Logout
            </Button>
          </Form>
        </div>
      </header>

      {/* Mobile: Top row - User info and logout (not sticky) */}
      <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-900 dark:text-gray-100">
            Logged in: {user.username}
          </span>
          <Form method="post" action="/logout">
            <Button
              type="submit"
              variant="secondary"
            >
              Logout
            </Button>
          </Form>
        </div>
      </div>

      {/* Mobile: Navigation (sticky) */}
      {user.isAdmin && (
        <Navigation className="md:hidden sticky top-0 z-10 bg-green-100 dark:bg-green-900 p-4 border-b border-green-300 dark:border-green-700" />
      )}
      <Outlet />
    </div>
  );
}
