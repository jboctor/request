import type { Route } from "./+types/auth-layout";
import { Outlet, Form, redirect, Link, useLocation } from "react-router";
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
  const validationInterval = 5 * 60 * 1000;
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
        args.context.session.destroy(() => {});
        return redirect("/");
      }

      args.context.session.user = {
        id: dbUser.id,
        username: dbUser.username,
        isAdmin: dbUser.isAdmin
      };
      args.context.session.lastValidated = now;

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

  return { user: sessionUser };
}

export default function AuthLayout({
  loaderData
}: Route.ComponentProps) {
  const { user } = loaderData;
  const location = useLocation();

  return (
    <div>
      {/* Desktop: Single row layout (sticky entire header) */}
      <header className="hidden md:block sticky top-0 bg-green-100 dark:bg-green-900 p-4 border-b border-green-300 dark:border-green-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link
              to="/settings"
              className={`px-3 py-1 rounded text-sm logged-in-user ${
                location.pathname === "/settings"
                  ? "bg-green-600 text-white"
                  : "text-green-800 dark:text-white hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100"
              }`}
            >
              Logged in: {user.username}
            </Link>
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
          <Link
            to="/settings"
            className={`px-3 py-1 rounded text-sm logged-in-user ${
              location.pathname === "/settings"
                ? "bg-green-600 text-white"
                : "text-gray-900 dark:text-gray-100 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            }`}
          >
            Logged in: {user.username}
          </Link>
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
        <div className="md:hidden sticky top-0 z-10 bg-green-100 dark:bg-green-900 border-b border-green-300 dark:border-green-700 overflow-x-auto">
          <Navigation className="p-4 whitespace-nowrap" />
        </div>
      )}
      <Outlet />
    </div>
  );
}
