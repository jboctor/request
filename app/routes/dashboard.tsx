import type { Route } from "./+types/dashboard";
import { Form, useNavigation, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { database } from "~/database/context";
import { request as requestTable, requestMediaTypeEnum } from "~/database/schema";
import { redirect } from "react-router";
import { eq, desc } from "drizzle-orm";

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
      .orderBy(desc(requestTable.dateCreated));

    return { requests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [] };
  }
}

export default function Dashboard({ actionData, loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"request" | "view">("request");
  const navigation = useNavigation();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "view" || tabParam === "request") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "request" | "view") => {
    setActiveTab(tab);
    setSearchParams({ tab });
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
                      <option value="book">Book</option>
                      <option value="movie">Movie</option>
                      <option value="tv-show">TV Show</option>
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
                  <button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className="w-full h-10 px-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {navigation.state === "submitting" ? "Submitting..." : "Submit Request"}
                  </button>
                </Form>
              </div>
            ) : (
              <div>
                <h2 className="text-center text-lg font-medium mb-4">Your Requests</h2>
                <div className="space-y-3">
                  {loaderData?.requests && loaderData.requests.length > 0 ? (
                    loaderData.requests.map((request) => (
                      <div key={request.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
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
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {request.status === "pending" ? "Pending" : "Completed"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No requests found. Submit your first request!
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
