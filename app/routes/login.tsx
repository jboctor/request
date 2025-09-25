import { database } from "~/database/context";
import { PasswordManager } from "~/auth/password";
import { AuthManager } from "~/auth/auth";
import { Button } from "~/components/Button";

import type { Route } from "./+types/login";
import { Form, useNavigation } from "react-router";
import { redirect } from "react-router";

const authManager = new AuthManager(new PasswordManager());

export function meta({}: Route.MetaArgs) {
  return [
    { title: "John Boctor Services" },
    { name: "description", content: "Welcome to John Boctor Services!" },
  ];
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

  const db = database();
  let user = null;
  try {
    user = await db.query.user.findFirst({
      where: (fields, operators) => operators.eq(fields.username, username),
      columns: {
        id: true,
        username: true,
        salt: true,
        password: true,
        isAdmin: true
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    await authManager.login(user, password, context.session);
  } catch (error) {
    return { error: "Database error", details: error instanceof Error ? error.message : String(error) };
  }

  return redirect("/dashboard");
}

export default function Home({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();

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
