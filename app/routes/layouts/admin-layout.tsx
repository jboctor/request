import type { Route } from "./+types/admin-layout";
import { Outlet, redirect } from "react-router";
import { UserService } from "~/services/userService";

export async function loader(args: Route.LoaderArgs) {
  const sessionUser = args.context?.session?.user;
  if (!sessionUser) {
    return redirect("/dashboard");
  }

  // Verify user still has admin privileges in database
  try {
    const dbUser = await UserService.getUserById(sessionUser.id);

    if (!dbUser || dbUser.dateDeleted || !dbUser.isAdmin) {
      return redirect("/dashboard");
    }

    return { user: dbUser };
  } catch (error) {
    console.error("Error verifying admin privileges:", error);
    return redirect("/dashboard");
  }
}

export default function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
