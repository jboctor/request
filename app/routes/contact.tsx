import type { Route } from "./+types/contact";
import { Form, Link, useNavigation, useRouteLoaderData } from "react-router";
import { useEffect, useRef } from "react";
import { Button } from "~/components/Button";
import { EmailService } from "~/services/emailService";
import { Alert } from "~/components/Alert";
import { FormInput, FormSelect, FormTextarea } from "~/components/FormField";

export function meta({ matches }: Route.MetaArgs) {
  const rootData = matches[0].loaderData as { adminName?: string };
  const adminName = rootData?.adminName;
  return [
    { title: `Contact - ${adminName} Services` },
    { name: "description", content: "Contact us or request a password reset" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const requestType = formData.get("requestType");
  const username = formData.get("username");
  const message = formData.get("message");

  if (typeof username !== "string" || !username.trim()) {
    return { error: "Username is required" };
  }

  if (typeof requestType !== "string") {
    return { error: "Invalid request type" };
  }

  try {
    await EmailService.sendContactRequest(
      requestType,
      username.trim(),
      typeof message === "string" ? message.trim() : undefined
    );

    if (requestType === "password-reset") {
      return {
        success: `Password reset request received. ${process.env.ADMIN_NAME} will contact you shortly to reset your password.`
      };
    } else {
      return {
        success: `Message received. ${process.env.ADMIN_NAME} will get back to you soon.`
      };
    }
  } catch (error) {
    console.error("Error sending contact request:", error);
    return { error: "Failed to send request. Please try again later." };
  }
}

export default function Contact({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const rootData = useRouteLoaderData("root") as { adminName?: string };
  const adminName = rootData?.adminName;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      formRef.current?.reset();
    }
  }, [actionData?.success, navigation.state]);

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-center">Contact</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Need help with your account? Send a message to {adminName}.
          </p>
        </div>

        {actionData?.error && (
          <Alert variant="error">{actionData.error}</Alert>
        )}

        {actionData?.success && (
          <Alert variant="success">{actionData.success}</Alert>
        )}

        <Form ref={formRef} method="post" className="space-y-4">
          <div>
            <label htmlFor="requestType" className="block text-sm font-medium mb-2">
              What do you need help with?
            </label>
            <FormSelect name="requestType" id="requestType" required>
              <option value="password-reset">Reset my password</option>
              <option value="general">General question or issue</option>
            </FormSelect>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Your Username
            </label>
            <FormInput type="text" name="username" id="username" required />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Additional Details (optional)
            </label>
            <FormTextarea name="message" id="message" rows={4} />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={navigation.state === "submitting"}
            className="w-full h-10"
          >
            Send Request
          </Button>
        </Form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-green-600 dark:text-green-400 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
