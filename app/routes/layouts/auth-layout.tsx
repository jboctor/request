import type { Route } from "./+types/auth-layout";
import { useLoaderData, Outlet, Form, redirect } from "react-router";
import type { InferSelectModel } from "drizzle-orm";
import type { user } from "~/database/schema";

type User = InferSelectModel<typeof user>;

async function checkAuth(args?: Route.LoaderArgs) {
  const user = args?.context?.session?.user;
  if (user?.id && user?.email) {
    return { id: user.id, email: user.email };
  }
  return null;
}

export async function loader(args: Route.LoaderArgs) {
  const user = await checkAuth(args);  // fetch or check session
  const currentPath = new URL(args.request.url).pathname;

  if (!user) {
    // If we're on the home route, don't redirect
    if (currentPath === "/") {
      return { user: null };
    }
    // Otherwise, redirect to home page
    return redirect("/");
  }
  return { user };
}

export default function AuthLayout() {
  const { user } = useLoaderData() as { user: User };
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <span>Logged in user: {user.email}</span>
        <Form method="post" action="/logout">
          <button type="submit">Logout</button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}
