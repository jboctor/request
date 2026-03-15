import type { Route } from "./+types/admin";
import { useState, useEffect } from "react";
import { useNavigation, useFetcher, useRouteLoaderData } from "react-router";
import { RequestService } from "~/services/requestService";
import { RequestActionService } from "~/services/requestActionService";
import { Button } from "~/components/Button";
import { Requests } from "~/components/Requests";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { PageLayout } from "~/components/PageLayout";

export function meta({ matches }: Route.MetaArgs) {
  const rootData = matches[0].loaderData as { adminName?: string };
  const adminName = rootData?.adminName;
  return [
    { title: `Admin Panel - ${adminName} Services` },
    { name: "description", content: "Admin panel for managing requests" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  return await RequestActionService.handleFormAction(formData, undefined, true);
}

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const requests = await RequestService.getAllRequests();
    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Admin({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const fetcher = useFetcher<typeof loader>();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetcher.load("/admin");
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetcher.load("/admin");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetcher]);

  // Use fetcher data if available, fallback to loaderData
  const currentRequests = fetcher.data?.requests || loaderData?.requests || [];

  return (
    <PageLayout title="Request Fulfillment" headingSize="xl">
      <FilteredItemsSection
        title="All Requests"
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
          isAdmin={true}
          isSubmitting={navigation.state === "submitting"}
          csrfToken={rootData?.csrfToken || ""}
          sortOrder="oldest"
        />
      </FilteredItemsSection>
    </PageLayout>
  );
}
