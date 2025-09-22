import { database } from "~/database/context";
import { PasswordManager } from "~/auth/password";
import { AuthManager } from "~/auth/auth";

import type { Route } from "./+types/login";
import { Login } from "~/home/login";
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
  let email = formData.get("email");
  let password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required" };
  }

  email = email.trim();
  if (!email) {
    return { error: "Email is required" };
  }

  password = password.trim();
  if (!password) {
    return { error: "Password is required" };
  }

  const db = database();
  let user = null;
  try {
    user = await db.query.user.findFirst({
      where: (fields, operators) => operators.eq(fields.email, email),
      columns: {
        id: true,
        email: true,
        salt: true,
        password: true,
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
  return (
    <Login />
  );
}
