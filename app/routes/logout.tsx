import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { AuthService } from "~/services/authService";

export async function action({ context }: Route.ActionArgs) {
  try {
    AuthService.logout(context.session);
    return redirect("/");
  } catch (error) {
    return { error: "Logout failed", details: error instanceof Error ? error.message : String(error) };
  }
}