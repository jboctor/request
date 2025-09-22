import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { PasswordManager } from "~/auth/password";
import { AuthManager } from "~/auth/auth";

const authManager = new AuthManager(new PasswordManager());

export async function action({ request, context }: Route.ActionArgs) {
  try {
    authManager.logout(context.session);
    return redirect("/");
  } catch (error) {
    return { error: "Logout failed", details: error instanceof Error ? error.message : String(error) };
  }

  return null;
}