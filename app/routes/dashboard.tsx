import type { Route } from "./+types/dashboard";
import { Form, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { requestMediaTypeEnum } from "~/database/schema";
import { redirect } from "react-router";
import { RequestService } from "~/services/requestService";
import { RequestActionService } from "~/services/requestActionService";
import { Button } from "~/components/Button";
import { Requests } from "~/components/Requests";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "John Boctor Services" },
    { name: "description", content: "Welcome to John Boctor Services!" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");

  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  if (action === "delete") {
    return await RequestActionService.handleFormAction(formData, user.id, false);
  }

  const title = formData.get("title");
  const mediaType = formData.get("mediaType");

  if (typeof title !== "string" || typeof mediaType !== "string") {
    return { error: "Title and media type are required" };
  }

  if (!title.trim() || !mediaType.trim()) {
    return { error: "Title and media type cannot be empty" };
  }

  const trimmedMediaType = mediaType.trim();
  if (!RequestService.isValidMediaType(trimmedMediaType)) {
    return { error: "Invalid media type selected" };
  }

  try {
    await RequestService.createRequest({
      userId: user.id,
      title: title.trim(),
      mediaType: trimmedMediaType
    });

    return { success: "Request submitted successfully!" };
  } catch (error) {
    console.error("Error inserting request:", error);
    return { error: "Failed to submit request" };
  }
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  try {
    const requests = await RequestService.getUserRequests(user.id);
    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Dashboard({ actionData, loaderData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<"request" | "view">("request");
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const savedTab = localStorage.getItem("dashboard-active-tab");
    if (savedTab === "view" || savedTab === "request") {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      handleTabChange("view");
    }
  }, [actionData?.success, navigation.state]);

  const handleTabChange = (tab: "request" | "view") => {
    setActiveTab(tab);
    localStorage.setItem("dashboard-active-tab", tab);
  };

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">Hello</h1>
          <div className="w-[700px] max-w-[100vw] p-4">
            <h1 className="block w-full text-center text-2xl">Welcome to John Boctor Services</h1>
          </div>
        </header>
        <div className="max-w-[700px] w-full space-y-6 px-4">
          <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabChange("request")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "request"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Request Service
              </button>
              <button
                onClick={() => handleTabChange("view")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "view"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                View Requests
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "request" ? (
              <div>
                <h2 className="text-center text-lg font-medium mb-4">Make a Request</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  💡 <strong>Tip:</strong> Please provide as much detail as possible in your request title, including author, release date, edition, or any other identifying information to help us find exactly what you're looking for.
                </div>
                {actionData?.error && (
                  <div className="text-red-600 text-center mb-4">{actionData.error}</div>
                )}
                {actionData?.success && (
                  <div className="text-green-600 text-center mb-4">{actionData.success}</div>
                )}
                <Form method="post" className="space-y-4">
                  <div>
                    <select
                      name="mediaType"
                      id="mediaType"
                      required
                      className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-500 h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Media Type</option>
                      {requestMediaTypeEnum.enumValues.map((mediaType) => (
                        <option key={mediaType} value={mediaType}>
                          {mediaType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      placeholder="Title"
                      maxLength={255}
                      required
                      className="w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-500 h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={navigation.state === "submitting"}
                  >
                    {navigation.state === "submitting" ? "Submitting..." : "Submit Request"}
                  </Button>
                </Form>
              </div>
            ) : (
              <div>
                <h2 className="text-center text-lg font-medium mb-4">Your Requests</h2>

                {/* Filter Controls */}
                <div className="flex justify-center gap-4 mb-4">
                  <Button
                    variant={showPending ? "warning" : "info"}
                    onClick={() => setShowPending(!showPending)}
                  >
                    {showPending ? "Hide" : "Show"} Pending
                  </Button>
                  <Button
                    variant={showCompleted ? "success" : "info"}
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    {showCompleted ? "Hide" : "Show"} Completed
                  </Button>
                  <Button
                    variant={showDeleted ? "alert" : "info"}
                    onClick={() => setShowDeleted(!showDeleted)}
                  >
                    {showDeleted ? "Hide" : "Show"} Deleted
                  </Button>
                </div>

                {actionData?.error && (
                  <div className="text-red-600 text-center mb-4">{actionData.error}</div>
                )}
                {actionData?.success && (
                  <div className="text-green-600 text-center mb-4">{actionData.success}</div>
                )}
            
                <Requests
                  requests={loaderData?.requests || []}
                  showPending={showPending}
                  showCompleted={showCompleted}
                  showDeleted={showDeleted}
                  isAdmin={false}
                  isSubmitting={navigation.state === "submitting"}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
