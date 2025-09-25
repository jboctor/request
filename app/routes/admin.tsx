import type { Route } from "./+types/admin";
import { useState } from "react";
import { useNavigation } from "react-router";
import { RequestService } from "~/services/requestService";
import { RequestActionService } from "~/services/requestActionService";
import { Button } from "~/components/Button";
import { Requests } from "~/components/Requests";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Panel - John Boctor Services" },
    { name: "description", content: "Admin panel for managing requests" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return await RequestActionService.handleFormAction(formData, undefined, true);
}

export async function loader({}: Route.LoaderArgs) {
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
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">Request Fulfillment</h1>
          <div className="w-[700px] max-w-[100vw] p-4">
            <h1 className="block w-full text-center text-2xl">Request Fulfillment</h1>
          </div>
        </header>
        <div className="max-w-[700px] w-full space-y-6 px-4">
          <section className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <h2 className="text-center text-lg font-medium mb-4">All Requests</h2>

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
              isAdmin={true}
              isSubmitting={navigation.state === "submitting"}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
