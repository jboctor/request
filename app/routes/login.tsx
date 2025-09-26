import { AuthService } from "~/services/authService";
import { Button } from "~/components/Button";
import { UserService } from "~/services/userService";

import type { Route } from "./+types/login";
import { Form, useNavigation, useNavigate, useRouteLoaderData } from "react-router";
import { redirect } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "John Boctor Services" },
    { name: "description", content: "Welcome to John Boctor Services!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (user?.id && user?.username) {
    return { isAuthenticated: true };
  }

  return { isAuthenticated: false };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  let username = formData.get("username");
  let password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string") {
    return { error: "Username and password are required" };
  }

  username = username.trim();
  if (!username) {
    return { error: "Username is required" };
  }

  password = password.trim();
  if (!password) {
    return { error: "Password is required" };
  }

  try {
    const user = await UserService.getUserByUsername(username);

    if (!user) {
      return { error: "User not found" };
    }

    if (user.dateDeleted) {
      return { error: "Account has been deactivated" };
    }

    await AuthService.login(user, password, context.session);
  } catch (error) {
    console.error("Error during login:", error);
    return { error: "Database error", details: error instanceof Error ? error.message : String(error) };
  }

  return redirect("/dashboard");
}

export default function Home({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };

  useEffect(() => {
    if (loaderData?.isAuthenticated && typeof window !== "undefined") {
      const lastAdminPage = localStorage.getItem("last-admin-page");
      const redirectTo = lastAdminPage || "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  }, [loaderData?.isAuthenticated, navigate]);

  if (loaderData?.isAuthenticated) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">Please Sign In</h1>
          <div className="w-[500px] max-w-[100vw] p-4">
            <h1 className="block w-full text-center text-2xl">Welcome to John Boctor Services</h1>
          </div>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            {actionData?.error && (
              <div className="text-red-600 text-center mb-4">{actionData.error}</div>
            )}
            <Form
              method="post"
              className="space-y-4 w-full max-w-lg"
              onSubmit={(event) => {
                if (navigation.state === "submitting") {
                  event.preventDefault();
                }
                const form = event.currentTarget;
                requestAnimationFrame(() => {
                  form.reset();
                });
              }}
            >
              {/* CSRF Protection Token - Hidden from user but included in form submission */}
              <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />

              <input
                name="username"
                placeholder="Username"
                required
                className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-500 h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-500 h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                variant="primary"
                loading={navigation.state === "submitting"}
                className="w-full h-10 px-3"
              >
                {navigation.state === "submitting" ? "Signing In..." : "Sign In"}
              </Button>
            </Form>
          </section>
        </div>
      </div>
    </main>
  );
}
