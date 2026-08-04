import type { AppLoadContext } from "react-router";
import { CSRFProtection } from "~/utils/csrf";
import { UserService } from "~/services/userService";

/**
 * Authorize an admin-only mutation from within a route `action`.
 *
 * React Router runs only the leaf route's `action` for a submission; parent
 * layout loaders (like `admin-layout`) merely revalidate *after* the action has
 * already run, so they do NOT gate mutations. Each admin action must therefore
 * authorize the request itself rather than relying on the layout. This also
 * validates the CSRF token, which the root-level `action` does not enforce for
 * child-route submissions.
 *
 * Returns an error object to hand straight back from the action, or `null` when
 * the request is allowed to proceed.
 */
export async function requireAdminAction(
  context: AppLoadContext,
  formData: FormData
): Promise<{ error: string } | null> {
  const csrfError = CSRFProtection.validateFormAction(formData, context.session);
  if (csrfError) {
    return { error: csrfError.error ?? "Invalid request. Please try again." };
  }

  const sessionUser = context.session?.user;
  if (!sessionUser?.id) {
    return { error: "You must be signed in to perform this action." };
  }

  const dbUser = await UserService.getUserById(sessionUser.id);
  if (!dbUser || dbUser.dateDeleted || !dbUser.isAdmin) {
    return { error: "You do not have permission to perform this action." };
  }

  return null;
}
