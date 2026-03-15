import type { Route } from "./+types/settings";
import { Form, useNavigation } from "react-router";
import { useState, useEffect, useRef } from "react";
import { redirect } from "react-router";
import { Button } from "~/components/Button";
import { SectionWrapper } from "~/components/SectionWrapper";
import { UserService } from "~/services/userService";
import { EmailService } from "~/services/emailService";
import { Alert } from "~/components/Alert";
import { FormInput } from "~/components/FormField";
import { PageLayout } from "~/components/PageLayout";
import { TabNav } from "~/components/TabNav";
import { CsrfInput } from "~/components/CsrfInput";

export function meta({ matches }: Route.MetaArgs) {
  const rootData = matches[0].loaderData as { adminName?: string };
  const adminName = rootData?.adminName;
  return [
    { title: `Settings - ${adminName} Services` },
    { name: "description", content: "Manage your account settings" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");

  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  if (action === "changePassword") {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return { error: "All password fields are required" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match" };
    }

    try {
      await UserService.changePassword(user.id, currentPassword, newPassword);
      return { success: "Password changed successfully!" };
    } catch (error) {
      console.error("Error changing password:", error);
      return { error: error instanceof Error ? error.message : "Failed to change password" };
    }
  }

  if (action === "updateEmail") {
    const email = formData.get("email");
    const allowNotifications = formData.get("allowNotifications") === "on";

    if (typeof email !== "string" || !email.trim()) {
      return { error: "Email address is required" };
    }

    try {
      const verificationToken = await UserService.setUserEmail(user.id, email, allowNotifications);
      await EmailService.sendVerificationEmail(email.trim(), verificationToken);
      return { success: "Email updated! Check your inbox for a verification link." };
    } catch (error) {
      console.error("Error updating email:", error);
      return { error: "Failed to update email" };
    }
  }

  if (action === "toggleNotifications") {
    try {
      const newValue = await UserService.toggleNotifications(user.id);
      return { success: `Notifications ${newValue ? "enabled" : "disabled"}!` };
    } catch (error) {
      console.error("Error toggling notifications:", error);
      return { error: "Failed to update notification settings" };
    }
  }

  if (action === "removeEmail") {
    try {
      await UserService.removeUserEmail(user.id);
      return { success: "Email removed successfully!" };
    } catch (error) {
      console.error("Error removing email:", error);
      return { error: "Failed to remove email" };
    }
  }

  if (action === "resendVerification") {
    try {
      const { email, token } = await UserService.generateNewVerificationToken(user.id);
      await EmailService.sendVerificationEmail(email, token);
      return { success: "Verification email sent! Check your inbox." };
    } catch (error) {
      console.error("Error resending verification email:", error);
      return { error: error instanceof Error ? error.message : "Failed to resend verification email" };
    }
  }

  return { error: "Invalid action" };
}

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  try {
    const email = await UserService.getUserEmail(user.id);
    return { user, email };
  } catch (error) {
    console.error("Error loading user email:", error);
    return { user, email: null };
  }
}

export default function Settings({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState<"password" | "email">("email");
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      passwordFormRef.current?.reset();
    }
  }, [actionData?.success, navigation.state]);

  return (
    <PageLayout title="Account Settings" contentMaxWidth="600px">
      <TabNav
        tabs={[
          { key: "email", label: "Email Address", id: "email-settings-button" },
          { key: "password", label: "Change Password", id: "password-settings-button" },
        ]}
        activeTab={activeSection}
        onTabChange={(key) => setActiveSection(key as "password" | "email")}
      />

      {actionData?.error && (
        <Alert variant="error">{actionData.error}</Alert>
      )}
      {actionData?.success && (
        <Alert variant="success">{actionData.success}</Alert>
      )}

      {/* Change Password Section */}
      {activeSection === "password" && (
        <SectionWrapper id="password-settings-section">
          <h2 className="text-lg font-medium mb-4">Change Password</h2>
          <Form ref={passwordFormRef} method="post" className="space-y-4">
            <CsrfInput />
            <input type="hidden" name="action" value="changePassword" />

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <FormInput
                type="password"
                name="currentPassword"
                id="currentPassword"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <FormInput
                type="password"
                name="newPassword"
                id="newPassword"
                required
                minLength={16}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <FormInput
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                minLength={16}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={navigation.state === "submitting"}
              className="w-full h-10"
            >
              Update Password
            </Button>
          </Form>
        </SectionWrapper>
      )}

      {/* Email Address Section */}
      {activeSection === "email" && (
        <SectionWrapper id="email-settings-section">
          <h2 className="text-lg font-medium mb-4">Email Address</h2>
          {loaderData?.email ? (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current email: <strong>{loaderData.email.email}</strong>
                  </p>
                  {loaderData.email.isVerified ? (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Verified
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Not verified - Check your email for verification link
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!loaderData.email.isVerified && (
                    <Form method="post" className="inline">
                      <CsrfInput />
                      <input type="hidden" name="action" value="resendVerification" />
                      <Button
                        type="submit"
                        variant="warning"
                        className="text-xs px-2 py-1"
                      >
                        Resend
                      </Button>
                    </Form>
                  )}
                  <Form method="post" className="inline">
                    <CsrfInput />
                    <input type="hidden" name="action" value="removeEmail" />
                    <Button
                      type="submit"
                      variant="alert"
                      className="text-xs px-2 py-1"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (!confirm("Are you sure you want to remove your email address?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </Form>
                </div>
              </div>
              <Form method="post" className="flex items-center gap-2">
                <CsrfInput />
                <input type="hidden" name="action" value="toggleNotifications" />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loaderData.email.allowNotifications}
                    onChange={(e) => {
                      e.currentTarget.form?.requestSubmit();
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Allow email notifications</span>
                </label>
              </Form>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No email address on file. Add one below to enable notifications.
            </p>
          )}
          <Form method="post" className="space-y-4">
            <CsrfInput />
            <input type="hidden" name="action" value="updateEmail" />

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {loaderData?.email ? "New Email Address" : "Email Address"}
              </label>
              <FormInput
                type="email"
                name="email"
                id="email"
                required
                maxLength={255}
                placeholder="your.email@example.com"
                defaultValue={loaderData?.email?.email || ""}
              />
            </div>

            {!loaderData?.email && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allowNotifications"
                  id="allowNotifications"
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="allowNotifications" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Allow email notifications
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={navigation.state === "submitting"}
              className="w-full h-10"
            >
              {loaderData?.email ? "Update Email" : "Add Email"}
            </Button>
          </Form>
        </SectionWrapper>
      )}
    </PageLayout>
  );
}
