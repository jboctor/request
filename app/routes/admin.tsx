import type { Route } from "./+types/admin";
import { Form, useNavigation } from "react-router";
import { useState } from "react";
import { RequestService } from "~/services/requestService";
import { Button } from "~/components/Button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Panel - John Boctor Services" },
    { name: "description", content: "Admin panel for managing requests" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const requestId = formData.get("requestId");
  const action = formData.get("action");

  if (!requestId || !action) {
    return { error: "Missing request ID or action" };
  }

  if (action !== "complete" && action !== "delete") {
    return { error: "Invalid action" };
  }

  try {
    const id = parseInt(requestId as string, 10);

    if (isNaN(id)) {
      return { error: "Invalid request ID" };
    }

    if (action === "complete") {
      const updatedRequest = await RequestService.completeRequest(id);

      if (!updatedRequest) {
        return { error: "Request not found" };
      }

      return { success: `Request "${updatedRequest.title}" marked as completed` };
    } else if (action === "delete") {
      const deletedRequest = await RequestService.deleteRequest(id);
      return { success: `Request "${deletedRequest.title}" deleted successfully` };
    }

    return { error: "Invalid action" };
  } catch (error) {
    console.error("Error updating request:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update request" };
  }
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
            <div className="space-y-3">
              {loaderData?.requests && loaderData.requests.length > 0 ? (
                loaderData.requests
                  .filter((request) => {
                    const isCompleted = request.dateCompleted !== null;
                    const isDeleted = request.dateDeleted !== null;

                    if (isDeleted) return showDeleted;

                    if (isCompleted) return showCompleted || false;

                    return !isCompleted && !isDeleted;
                  })
                  .map((request) => {
                  const isCompleted = request.dateCompleted !== null;
                  const isDeleted = request.dateDeleted !== null;
                  const status = isDeleted ? "deleted" : (isCompleted ? "completed" : "pending");

                  return (
                    <div key={request.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-medium">{request.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {request.mediaType}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Requested on {new Date(request.dateCreated).toLocaleString()}
                          </p>
                          {isCompleted && request.dateCompleted && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Completed on {new Date(request.dateCompleted).toLocaleString()}
                            </p>
                          )}
                          {isDeleted && request.dateDeleted && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Deleted on {new Date(request.dateDeleted).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {status === "pending" ? "Pending" : status === "completed" ? "Completed" : "Deleted"}
                          </span>
                          {status === "pending" && (
                            <div className="flex gap-2">
                              <Form method="post" className="inline">
                                <input type="hidden" name="requestId" value={request.id} />
                                <input type="hidden" name="action" value="complete" />
                                <Button
                                  type="submit"
                                  variant="success"
                                  disabled={navigation.state === "submitting"}
                                >
                                  Mark Complete
                                </Button>
                              </Form>
                              <Form method="post" className="inline">
                                <input type="hidden" name="requestId" value={request.id} />
                                <input type="hidden" name="action" value="delete" />
                                <Button
                                  type="submit"
                                  variant="alert"
                                  disabled={navigation.state === "submitting"}
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    if (!confirm("Are you sure you want to delete this request?")) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                                </Form>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No requests found.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
