import type { Route } from "./+types/admin.features";
import { useState, useEffect, useRef } from "react";
import { useNavigation, Form, useRouteLoaderData } from "react-router";
import { Button } from "~/components/Button";
import { NewFeatureService } from "~/services/newFeatureService";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { SectionWrapper } from "~/components/SectionWrapper";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Feature Management - Admin Panel" },
    { name: "description", content: "Manage new feature announcements" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "create": {
        const page = formData.get("page") as string;
        const selector = formData.get("selector") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        if (!page || !selector || !title || !description) {
          return { error: "All fields are required" };
        }

        if (title.length < 3) {
          return { error: "Title must be at least 3 characters long" };
        }

        if (description.length < 10) {
          return { error: "Description must be at least 10 characters long" };
        }

        await NewFeatureService.createFeature({ page, selector, title, description });
        return { success: `Feature "${title}" created successfully` };
      }

      case "clear-dismissals": {
        const featureId = parseInt(formData.get("featureId") as string);
        if (!featureId) return { error: "Invalid feature ID" };

        await NewFeatureService.clearAllDismissalsForFeature(featureId);
        return { success: "All dismissals cleared for feature - users will see it again" };
      }

      case "deactivate": {
        const featureId = parseInt(formData.get("featureId") as string);
        if (!featureId) return { error: "Invalid feature ID" };

        await NewFeatureService.deactivateFeature(featureId);
        return { success: "Feature deactivated successfully" };
      }

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Feature management error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An error occurred while processing your request" };
  }
}

export async function loader() {
  try {
    const features = await NewFeatureService.getAllActiveFeatures();
    return { features };
  } catch (error) {
    console.error("Error fetching features:", error);
    return { features: [] };
  }
}

export default function AdminFeatures({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const createFormRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Clear create feature form on successful feature creation
  useEffect(() => {
    if (actionData?.success && !isSubmitting) {
      setShowCreateForm(false);
    }
  }, [actionData?.success, isSubmitting]);

  const features = loaderData?.features || [];

  // Common page options for the dropdown
  const pageOptions = [
    { value: '/dashboard', label: 'Dashboard' },
    { value: '/settings', label: 'Settings' },
    { value: '/admin', label: 'Admin Panel' },
    { value: '/admin/users', label: 'User Management' },
    { value: '/admin/features', label: 'Feature Management' },
  ];

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">Feature Management</h1>
          <div className="w-[900px] max-w-[100vw] p-4">
            <h1 className="block w-full text-center text-2xl">Feature Management</h1>
          </div>
        </header>

        <div className="max-w-[900px] w-full space-y-6 px-4">
          {/* Create Feature Form */}
          <SectionWrapper>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Create New Feature</h2>
              <Button
                variant={showCreateForm ? "alert" : "success"}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Cancel" : "Add Feature"}
              </Button>
            </div>

            {showCreateForm && (
              <Form ref={createFormRef} method="post" className="space-y-4">
                <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                <input type="hidden" name="action" value="create" />

                <div>
                  <label className="block text-sm font-medium mb-1">Page</label>
                  <select
                    name="page"
                    required
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select a page</option>
                    {pageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CSS Selector</label>
                  <input
                    type="text"
                    name="selector"
                    required
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., #create-request-btn, .nav-item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Feature Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    minLength={3}
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter feature title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    minLength={10}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 resize-none"
                    placeholder="Describe the new feature..."
                  />
                </div>

                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Feature"}
                </Button>
              </Form>
            )}
          </SectionWrapper>

          {/* Features List */}
          <FilteredItemsSection
            title={`Active Features (${features.length})`}
            actionData={actionData}
            filterControls={<></>}
          >
            {!features.length ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No active features found.
              </div>
            ) : (
              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {feature.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span><strong>Page:</strong> {feature.page}</span>
                          <span><strong>Selector:</strong> {feature.selector}</span>
                          <span><strong>Created:</strong> {feature.dateCreatedFormatted}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                        <div className="flex gap-2">
                          <Form method="post" className="inline">
                            <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                            <input type="hidden" name="action" value="clear-dismissals" />
                            <input type="hidden" name="featureId" value={feature.id} />
                            <Button
                              type="submit"
                              variant="alert"
                              disabled={isSubmitting}
                              onClick={(e) => {
                                if (!confirm(`Clear all dismissals for "${feature.title}"? Users will see this feature again.`)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Reset
                            </Button>
                          </Form>
                          <Form method="post" className="inline">
                            <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                            <input type="hidden" name="action" value="deactivate" />
                            <input type="hidden" name="featureId" value={feature.id} />
                            <Button
                              type="submit"
                              variant="alert"
                              disabled={isSubmitting}
                              onClick={(e) => {
                                if (!confirm(`Are you sure you want to deactivate "${feature.title}"?`)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Deactivate
                            </Button>
                          </Form>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FilteredItemsSection>
        </div>
      </div>
    </main>
  );
}