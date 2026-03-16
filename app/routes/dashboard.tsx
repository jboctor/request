import type { Route } from "./+types/dashboard";
import { Form, useNavigation, useFetcher, useRouteLoaderData } from "react-router";
import { useState, useEffect } from "react";
import { requestMediaTypeEnum } from "~/database/schema";
import { redirect } from "react-router";
import { RequestService } from "~/services/requestService";
import { RequestActionService } from "~/services/requestActionService";
import { Button } from "~/components/Button";
import { Requests } from "~/components/Requests";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { SectionWrapper } from "~/components/SectionWrapper";
import { Alert } from "~/components/Alert";
import { FormSelect } from "~/components/FormField";
import { MediaSearchInput } from "~/components/MediaSearchInput";
import { PageLayout } from "~/components/PageLayout";
import { TabNav } from "~/components/TabNav";
import { CsrfInput } from "~/components/CsrfInput";

export function meta({ matches }: Route.MetaArgs) {
  const rootData = matches[0].loaderData as { adminName?: string };
  const adminName = rootData?.adminName;
  return [
    { title: `${adminName} Services` },
    { name: "description", content: `Welcome to ${adminName} Services!` },
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
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigation = useNavigation();
  const fetcher = useFetcher<typeof loader>();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string; adminName?: string };
  const adminName = rootData?.adminName;

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetcher.load("/dashboard");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetcher]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "request" | "view");
    localStorage.setItem("dashboard-active-tab", tab);
  };

  const currentRequests = fetcher.data?.requests || loaderData?.requests || [];

  return (
    <PageLayout title={`Welcome to ${adminName} Services`} srTitle="Hello">
      <section className="space-y-4">
        <TabNav
          tabs={[
            { key: "request", label: "Request Service" },
            { key: "view", label: "View Requests" },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        {activeTab === "request" ? (
          <SectionWrapper id="request-service">
            <h2 className="text-center text-lg font-medium mb-4">Make a Request</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 p-3 bg-green-50 dark:bg-green-400/10 rounded-card-alt border border-green-200 dark:border-green-800 border-l-4 border-l-green-500">
              💡 <strong>Tip:</strong> Please provide as much detail as possible in your request title, including author, release date, edition, or any other identifying information to help us find exactly what you're looking for.
            </div>
            {actionData?.error && (
              <Alert variant="error">{actionData.error}</Alert>
            )}
            {actionData?.success && (
              <Alert variant="success">{actionData.success}</Alert>
            )}
            <Form method="post" className="space-y-4">
              <CsrfInput />

              <div>
                <FormSelect
                  name="mediaType"
                  id="mediaType"
                  required
                  value={selectedMediaType}
                  onChange={(e) => setSelectedMediaType(e.target.value)}
                >
                  <option value="">Select Media Type</option>
                  {requestMediaTypeEnum.enumValues.map((mediaType) => (
                    <option key={mediaType} value={mediaType}>
                      {mediaType}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <MediaSearchInput
                  name="title"
                  id="title"
                  placeholder="Title"
                  maxLength={255}
                  required
                  mediaType={selectedMediaType}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={navigation.state === "submitting"}
                className="w-full h-10 px-3"
              >
                {navigation.state === "submitting" ? "Submitting..." : "Submit Request"}
              </Button>
            </Form>
          </SectionWrapper>
        ) : (
          <FilteredItemsSection
            title="Your Requests"
            actionData={actionData}
            filterControls={
              <>
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
              </>
            }
          >
            <Requests
              requests={currentRequests}
              showPending={showPending}
              showCompleted={showCompleted}
              showDeleted={showDeleted}
              isAdmin={false}
              isSubmitting={navigation.state === "submitting"}
              csrfToken={rootData?.csrfToken || ""}
            />
          </FilteredItemsSection>
        )}
      </section>
    </PageLayout>
  );
}
