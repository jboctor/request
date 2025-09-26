import type { Route } from "./+types/auth-layout";
import { Outlet, Form, redirect, Link, useLocation } from "react-router";
import { Button } from "~/components/Button";
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

  // Verify user still exists and is not deleted
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

    // Update session with current user data (in case admin status changed)
    const user = {
      id: dbUser.id,
      username: dbUser.username,
      isAdmin: dbUser.isAdmin
    };

    return { user };
  } catch (error) {
    console.error("Error verifying user session:", error);
    return redirect("/");
  }
}

export default function AuthLayout({
  loaderData
}: Route.ComponentProps) {
  const { user } = loaderData;
  const location = useLocation();

  return (
    <div>
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <span className="text-gray-900 dark:text-gray-100">
            Logged in: {user.username}
          </span>
          {user.isAdmin && (
            <nav className="flex gap-4">
              <Link
                to="/dashboard"
                className={`px-3 py-1 rounded text-sm ${
                  location.pathname === "/dashboard"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1 rounded text-sm ${
                  location.pathname === "/admin"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Fulfillment
              </Link>
              <Link
                to="/admin/users"
                className={`px-3 py-1 rounded text-sm ${
                  location.pathname === "/admin/users"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Users
              </Link>
            </nav>
          )}
        </div>
        <Form method="post" action="/logout">
          <Button
            type="submit"
            variant="secondary"
          >
            Logout
          </Button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}
