import type { Route } from "./+types/admin";
import { RequestFulfillment } from "~/dashboard/request-fulfillment";
import { database } from "~/database/context";
import { request as requestTable, user } from "~/database/schema";
import { eq } from "drizzle-orm";

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
      .set({ status: "completed" })
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

    // Get all requests with user information
    const requests = await db
      .select({
        id: requestTable.id,
        title: requestTable.title,
        mediaType: requestTable.mediaType,
        status: requestTable.status,
        userId: requestTable.userId,
        userEmail: user.email
      })
      .from(requestTable)
      .leftJoin(user, eq(requestTable.userId, user.id))
      .orderBy(requestTable.id);

    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Admin({ actionData, loaderData }: Route.ComponentProps) {
  return (
    <RequestFulfillment actionData={actionData} loaderData={loaderData} />
  );
}
