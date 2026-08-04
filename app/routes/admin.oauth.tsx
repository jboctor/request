import type { Route } from "./+types/admin.oauth";
import { useNavigation, Form } from "react-router";
import { Button } from "~/components/Button";
import { OAuthService } from "~/services/oauthService";
import { requireAdminAction } from "~/services/authGuard";
import { SectionWrapper } from "~/components/SectionWrapper";
import { FormInput } from "~/components/FormField";
import { PageLayout } from "~/components/PageLayout";
import { CsrfInput } from "~/components/CsrfInput";
import { Alert } from "~/components/Alert";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "OAuth Configuration - Admin Panel" },
    { name: "description", content: "Configure OAuth single sign-on" },
  ];
}

export async function action({ request, context }: Route.ActionArgs): Promise<{ error?: string; success?: string }> {
  const formData = await request.formData();

  const denied = await requireAdminAction(context, formData);
  if (denied) return denied;

  try {
    const providerName = (formData.get("providerName") as string)?.trim();
    const clientId = (formData.get("clientId") as string)?.trim();
    const submittedSecret = (formData.get("clientSecret") as string)?.trim();
    const authorizationUrl = (formData.get("authorizationUrl") as string)?.trim();
    const tokenUrl = (formData.get("tokenUrl") as string)?.trim();
    const userInfoUrl = (formData.get("userInfoUrl") as string)?.trim();
    const scopes = (formData.get("scopes") as string)?.trim() || "openid email profile";
    const usernameClaim = (formData.get("usernameClaim") as string)?.trim() || "email";
    const enabled = formData.get("enabled") === "true";
    const autoCreateUsers = formData.get("autoCreateUsers") === "true";

    if (!providerName) return { error: "Provider name is required" };
    if (!clientId) return { error: "Client ID is required" };
    if (!authorizationUrl) return { error: "Authorization URL is required" };
    if (!tokenUrl) return { error: "Token URL is required" };
    if (!userInfoUrl) return { error: "User info URL is required" };

    const existing = await OAuthService.getConfig();

    // Keep the stored secret when the field is left blank on an existing config.
    const clientSecret = submittedSecret || existing?.clientSecret || "";
    if (!clientSecret) {
      return { error: "Client secret is required" };
    }

    if (enabled && (!clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl)) {
      return { error: "All fields are required to enable OAuth sign-in" };
    }

    await OAuthService.upsertConfig({
      providerName,
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
      scopes,
      usernameClaim,
      enabled,
      autoCreateUsers,
    });

    return { success: "OAuth configuration saved successfully" };
  } catch (error) {
    console.error("OAuth configuration error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An error occurred while saving the configuration" };
  }
}

export async function loader() {
  let redirectUri = "";
  try {
    redirectUri = OAuthService.getRedirectUri();
  } catch {
    redirectUri = "";
  }

  try {
    const config = await OAuthService.getConfig();
    // Never send the stored client secret to the browser.
    return {
      redirectUri,
      config: config
        ? {
            providerName: config.providerName,
            clientId: config.clientId,
            authorizationUrl: config.authorizationUrl,
            tokenUrl: config.tokenUrl,
            userInfoUrl: config.userInfoUrl,
            scopes: config.scopes,
            usernameClaim: config.usernameClaim,
            enabled: config.enabled,
            autoCreateUsers: config.autoCreateUsers,
            hasSecret: !!config.clientSecret,
          }
        : null,
    };
  } catch (error) {
    console.error("Error loading OAuth config:", error);
    return { redirectUri, config: null };
  }
}

export default function AdminOAuth({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const config = loaderData?.config;

  return (
    <PageLayout title="OAuth Configuration" headingSize="xl" contentMaxWidth="700px">
      {actionData?.error && <Alert variant="error">{actionData.error}</Alert>}
      {actionData?.success && <Alert variant="success">{actionData.success}</Alert>}

      <SectionWrapper>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Single Sign-On Provider</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              config?.enabled
                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-black dark:text-gray-200 dark:border-gray-700"
            }`}
          >
            {config?.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure a generic OAuth 2.0 / OpenID Connect provider (Google, GitHub, Okta,
          Azure AD, Auth0, etc.). Register the redirect URI below with your provider.
        </p>

        {loaderData?.redirectUri && (
          <div className="p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Redirect URI (callback)</p>
            <code className="text-sm break-all text-gray-800 dark:text-gray-200">
              {loaderData.redirectUri}
            </code>
          </div>
        )}

        <Form method="post" className="space-y-4">
          <CsrfInput />

          <div>
            <label className="block text-sm font-medium mb-1">Provider Display Name</label>
            <FormInput
              type="text"
              name="providerName"
              required
              placeholder="e.g., Google"
              defaultValue={config?.providerName ?? "OAuth"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Client ID</label>
            <FormInput
              type="text"
              name="clientId"
              required
              placeholder="Client ID from your provider"
              defaultValue={config?.clientId ?? ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Client Secret</label>
            <FormInput
              type="password"
              name="clientSecret"
              autoComplete="off"
              placeholder={config?.hasSecret ? "•••••••• (leave blank to keep current)" : "Client secret from your provider"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Authorization URL</label>
            <FormInput
              type="url"
              name="authorizationUrl"
              required
              placeholder="https://accounts.google.com/o/oauth2/v2/auth"
              defaultValue={config?.authorizationUrl ?? ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Token URL</label>
            <FormInput
              type="url"
              name="tokenUrl"
              required
              placeholder="https://oauth2.googleapis.com/token"
              defaultValue={config?.tokenUrl ?? ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User Info URL</label>
            <FormInput
              type="url"
              name="userInfoUrl"
              required
              placeholder="https://openidconnect.googleapis.com/v1/userinfo"
              defaultValue={config?.userInfoUrl ?? ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scopes</label>
            <FormInput
              type="text"
              name="scopes"
              placeholder="openid email profile"
              defaultValue={config?.scopes ?? "openid email profile"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username Claim</label>
            <FormInput
              type="text"
              name="usernameClaim"
              placeholder="email"
              defaultValue={config?.usernameClaim ?? "email"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The field from the provider's user info that is matched against the app username
              (e.g. <code>email</code>, <code>preferred_username</code>, or <code>login</code>).
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="enabled"
              value="true"
              id="enabled"
              className="mr-2"
              defaultChecked={config?.enabled ?? false}
            />
            <label htmlFor="enabled" className="text-sm">Enable OAuth sign-in</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="autoCreateUsers"
              value="true"
              id="autoCreateUsers"
              className="mr-2"
              defaultChecked={config?.autoCreateUsers ?? false}
            />
            <label htmlFor="autoCreateUsers" className="text-sm">
              Automatically create an account on first sign-in
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            When disabled, only users whose username already exists can sign in via OAuth.
          </p>

          <Button type="submit" variant="primary" loading={isSubmitting} className="w-full h-10">
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </Form>
      </SectionWrapper>
    </PageLayout>
  );
}
