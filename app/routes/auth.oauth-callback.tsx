import type { Route } from "./+types/auth.oauth-callback";
import { Link, redirect } from "react-router";
import { OAuthService } from "~/services/oauthService";
import { AuthService } from "~/services/authService";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  const expectedState = context.session.oauthState;
  // The state is single-use; clear it regardless of outcome.
  context.session.oauthState = undefined;

  if (providerError) {
    return { error: "Sign-in was cancelled or denied by the provider." };
  }

  if (!code || !state) {
    return { error: "Missing authorization code from the provider." };
  }

  if (!expectedState || state !== expectedState) {
    return { error: "Invalid or expired sign-in request. Please try again." };
  }

  const config = await OAuthService.getConfig();
  if (!config || !config.enabled) {
    return { error: "OAuth sign-in is not currently enabled." };
  }

  try {
    const user = await OAuthService.handleCallback(config, code);
    await AuthService.loginWithoutPassword(user, context.session);
    return redirect("/dashboard");
  } catch (error) {
    console.error("OAuth callback error:", error);
    return {
      error: error instanceof Error ? error.message : "OAuth sign-in failed.",
    };
  }
}

export default function OAuthCallback({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <div className="rounded-card-alt border p-8 text-center border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg shadow-red-500/10 dark:border-red-900 dark:from-red-950 dark:to-red-900/50">
          <div className="text-5xl mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50">
            ✗
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-red-900 dark:text-red-100">
            Sign-in Failed
          </h1>
          <p className="text-red-700 dark:text-red-300">{loaderData.error}</p>
          <Link
            to="/"
            className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:shadow-md hover:shadow-green-500/25 transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
