import type { Route } from "./+types/admin-layout";
import { Outlet, redirect } from "react-router";

export async function loader(args: Route.LoaderArgs) {
  const user = args.context?.session?.user;
  if (!user || !user.isAdmin) {
    return redirect("/dashboard");
  }

  return { user };
}

export default function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
