import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { CSRFProtection } from "~/utils/csrf";

export async function loader({ context }: Route.LoaderArgs) {
  // Ensure CSRF token is available globally
  const csrfToken = CSRFProtection.getToken(context.session);
  return { csrfToken, adminName: process.env.ADMIN_NAME };
}

export async function action({ request, context }: Route.ActionArgs) {
  // Global CSRF validation for all POST requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    let csrfToken: string | null = null;

    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      csrfToken = body.csrfToken;
    } else {
      const formData = await request.formData();
      csrfToken = formData.get("csrfToken") as string;
    }

    if (!CSRFProtection.verifyToken(context.session, csrfToken)) {
      return { error: "Invalid request. Please try again." };
    }
  }

  // If CSRF validation passes, continue to child route action
  // React Router will automatically delegate to the matching child route
  return null;
}

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' ws://localhost:*;"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
