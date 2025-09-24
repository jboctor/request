import type { Route } from "./+types/auth-layout";
import { Outlet, Form, redirect, Link, useLocation } from "react-router";

function checkAuth(args?: Route.LoaderArgs) {
  const user = args?.context?.session?.user;
  if (user?.id && user?.email) {
    return { id: user.id, email: user.email, isAdmin: user.isAdmin ?? false };
  }
  return null;
}

export async function loader(args: Route.LoaderArgs) {
  const user = checkAuth(args);

  if (!user) {
    return redirect("/");
  }

  return { user };
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
            Logged in: {user.email}
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
            </nav>
          )}
        </div>
        <Form method="post" action="/logout">
          <button
            type="submit"
            className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            Logout
          </button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}
