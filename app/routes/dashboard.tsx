import type { Route } from "./+types/dashboard";
import { RequestForm } from "~/dashboard/request-form";
import { database } from "~/database/context";
import { request as requestTable, requestMediaTypeEnum } from "~/database/schema";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "John Boctor Services" },
    { name: "description", content: "Welcome to John Boctor Services!" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");
  const mediaType = formData.get("mediaType");

  if (typeof title !== "string" || typeof mediaType !== "string") {
    return { error: "Title and media type are required" };
  }

  if (!title.trim() || !mediaType.trim()) {
    return { error: "Title and media type cannot be empty" };
  }

  const validMediaTypes = requestMediaTypeEnum.enumValues;
  if (!validMediaTypes.includes(mediaType as any)) {
    return { error: "Invalid media type selected" };
  }

  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  try {
    const db = database();
    await db.insert(requestTable).values({
      userId: user.id,
      title: title.trim(),
      mediaType: mediaType.trim() as typeof requestMediaTypeEnum.enumValues[number],
      status: "pending"
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
    const db = database();
    const requests = await db
      .select()
      .from(requestTable)
      .where(eq(requestTable.userId, user.id))
      .orderBy(requestTable.id);

    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Dashboard({ actionData, loaderData }: Route.ComponentProps) {
  return (
    <RequestForm actionData={actionData} loaderData={loaderData} />
  );
}
