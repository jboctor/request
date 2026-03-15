import type { Route } from "./+types/verify-email";
import { Link } from "react-router";
import { UserService } from "~/services/userService";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { success: false, message: "Missing verification token", isLoggedIn: false };
  }

  const verified = await UserService.verifyEmail(token);
  const isLoggedIn = !!(context.session?.user?.id);

  // Touch and save session to ensure it persists across page navigation
  if (context.session) {
    context.session.touch();
    await new Promise<void>((resolve, reject) => {
      context.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  if (verified) {
    return { success: true, message: "Email verified successfully!", isLoggedIn };
  } else {
    return { success: false, message: "Invalid or expired verification link", isLoggedIn };
  }
}

export default function VerifyEmail({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <div className={`${loaderData.success ? 'rounded-card' : 'rounded-card-alt'} border p-8 text-center ${
          loaderData.success
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg shadow-green-500/10 dark:border-green-900 dark:from-green-950 dark:to-green-900/50'
            : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg shadow-red-500/10 dark:border-red-900 dark:from-red-950 dark:to-red-900/50'
        }`}>
          <div className={`text-5xl mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full ${
            loaderData.success
              ? 'bg-green-100 dark:bg-green-900/50'
              : 'bg-red-100 dark:bg-red-900/50'
          }`}>
            {loaderData.success ? '✓' : '✗'}
          </div>
          <h1 className={`text-2xl font-semibold mb-2 ${
            loaderData.success
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {loaderData.success ? 'Email Verified!' : 'Verification Failed'}
          </h1>
          <p className={loaderData.success
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'
          }>
            {loaderData.message}
          </p>
          {loaderData.success && loaderData.isLoggedIn && (
            <Link
              to="/dashboard"
              className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:shadow-md hover:shadow-green-500/25 transition-all duration-200"
            >
              Return to Dashboard
            </Link>
          )}
          {loaderData.success && !loaderData.isLoggedIn && (
            <Link
              to="/"
              className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:shadow-md hover:shadow-green-500/25 transition-all duration-200"
            >
              Go to Login
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
