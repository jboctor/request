import type { Route } from "./+types/auth-layout";
import { Outlet, Form, redirect, Link, useLocation } from "react-router";
import { Button } from "~/components/Button";
import { Navigation } from "~/components/Navigation";
import { database } from "~/database/context";
import { UserService } from "~/services/userService";

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
    } catch (error) {
      console.error("Error verifying user session:", error);
      return redirect("/");
    }
  }

  // Check if user has unverified email
  try {
    const email = await UserService.getUserEmail(sessionUser.id);
    const hasUnverifiedEmail = email && !email.isVerified;
    return { user: sessionUser, hasUnverifiedEmail };
  } catch (error) {
    console.error("Error checking email verification:", error);
    return { user: sessionUser, hasUnverifiedEmail: false };
  }
}

export default function AuthLayout({
  loaderData
}: Route.ComponentProps) {
  const { user, hasUnverifiedEmail } = loaderData;
  const location = useLocation();

  return (
    <div>
      {/* Unverified email banner */}
      {hasUnverifiedEmail && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50 dark:from-amber-900/20 dark:via-amber-900/10 dark:to-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Your email address is not verified. <Link to="/settings" className="underline hover:no-underline font-medium">Verify it now</Link> to receive notifications.
            </p>
          </div>
        </div>
      )}
      {/* Desktop: Bookmark tabs pinned to top */}
      <header className="hidden md:block sticky top-0 z-20 px-4 pt-0 overflow-visible">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-1">
            <Link
              to="/settings"
              className={`px-4 rounded-b-xl text-sm font-medium logged-in-user ${
                location.pathname === "/settings"
                  ? "pt-4 pb-2.5 -mb-2 bg-gradient-to-b from-green-600 to-green-500 text-white shadow-md shadow-green-600/30 dark:from-green-800 dark:to-green-700 dark:shadow-green-400/20 border-x border-b border-transparent"
                  : "py-2 bg-white/70 dark:bg-emerald-950/60 text-green-800 dark:text-green-200 hover:bg-white/90 dark:hover:bg-emerald-900/60 border-x border-b border-green-200/40 dark:border-green-800/40"
              }`}
            >
              {user.username}
            </Link>
            {user.isAdmin && <Navigation />}
          </div>
          <div className="py-2">
            <Form method="post" action="/logout" onSubmit={() => localStorage.removeItem("recommendations-cache")}>
              <Button
                type="submit"
                variant="secondary"
              >
                Logout
              </Button>
            </Form>
          </div>
        </div>
      </header>

      {/* Mobile: Top row - User info and logout (not sticky) */}
      <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <Link
            to="/settings"
            className={`px-3 py-1 rounded-lg text-sm logged-in-user ${
              location.pathname === "/settings"
                ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-600/30 dark:shadow-green-400/20"
                : "text-gray-900 dark:text-gray-100 hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
            }`}
          >
            Logged in: {user.username}
          </Link>
          <Form method="post" action="/logout" onSubmit={() => localStorage.removeItem("recommendations-cache")}>
            <Button
              type="submit"
              variant="secondary"
            >
              Logout
            </Button>
          </Form>
        </div>
      </div>

      {/* Mobile: Navigation tabs (sticky) */}
      {user.isAdmin && (
        <div className="md:hidden sticky top-0 z-20 px-4 pt-0 overflow-visible">
          <Navigation className="py-0 whitespace-nowrap" />
        </div>
      )}
      <Outlet />
    </div>
  );
}
