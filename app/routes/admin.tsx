import type { Route } from "./+types/admin";
import { Form, useNavigation } from "react-router";
import { database } from "~/database/context";
import { request as requestTable } from "~/database/schema";
import { eq, asc } from "drizzle-orm";

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

  if (action !== "complete") {
    return { error: "Invalid action" };
  }

  try {
    const db = database();
    const id = parseInt(requestId as string, 10);

    if (isNaN(id)) {
      return { error: "Invalid request ID" };
    }

    // Update request status to completed
    const [updatedRequest] = await db
      .update(requestTable)
      .set({ status: "completed", dateCompleted: new Date() })
      .where(eq(requestTable.id, id))
      .returning({
        id: requestTable.id,
        title: requestTable.title
      });

    if (!updatedRequest) {
      return { error: "Request not found" };
    }

    return { success: `Request "${updatedRequest.title}" marked as completed` };
  } catch (error) {
    console.error("Error updating request:", error);
    return { error: "Failed to update request status" };
  }
}

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const db = database();

    const requests = await db
      .select({
        id: requestTable.id,
        title: requestTable.title,
        mediaType: requestTable.mediaType,
        status: requestTable.status,
        userId: requestTable.userId,
        dateCreated: requestTable.dateCreated,
        dateCompleted: requestTable.dateCompleted
      })
      .from(requestTable)
      .orderBy(
        asc(requestTable.status),
        asc(requestTable.dateCreated)
      );

    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Admin({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();

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
            {actionData?.error && (
              <div className="text-red-600 text-center mb-4">{actionData.error}</div>
            )}
            {actionData?.success && (
              <div className="text-green-600 text-center mb-4">{actionData.success}</div>
            )}
            <div className="space-y-3">
              {loaderData?.requests && loaderData.requests.length > 0 ? (
                loaderData.requests.map((request) => (
                  <div key={request.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-medium">{request.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {request.mediaType.replace('-', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Requested on {new Date(request.dateCreated).toLocaleString()}
                        </p>
                        {request.status === "completed" && request.dateCompleted && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Completed on {new Date(request.dateCompleted).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}>
                          {request.status === "pending" ? "Pending" : "Completed"}
                        </span>
                        {request.status === "pending" && (
                          <Form method="post" className="inline">
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="action" value="complete" />
                            <button
                              type="submit"
                              disabled={navigation.state === "submitting"}
                              className="text-sm px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Mark Complete
                            </button>
                          </Form>
                        )}
                      </div>
                    </div>
                  </div>
                ))
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
