import type { Route } from "./+types/admin.features";
import { useState, useEffect, useRef } from "react";
import { useNavigation, Form } from "react-router";
import { Button } from "~/components/Button";
import { NewFeatureService } from "~/services/newFeatureService";
import { UserService } from "~/services/userService";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { SectionWrapper } from "~/components/SectionWrapper";
import { FormInput, FormSelect, FormTextarea } from "~/components/FormField";
import { PageLayout } from "~/components/PageLayout";
import { CsrfInput } from "~/components/CsrfInput";

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

      case "clear-dismissal-for-user": {
        const featureId = parseInt(formData.get("featureId") as string);
        const userId = parseInt(formData.get("userId") as string);
        if (!featureId) return { error: "Invalid feature ID" };
        if (!userId) return { error: "Please select a user" };

        await NewFeatureService.clearDismissal(userId, featureId);
        return { success: "Dismissal cleared for user - they will see this feature again" };
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
    const [features, users] = await Promise.all([
      NewFeatureService.getAllActiveFeatures(),
      UserService.getAllUsers(),
    ]);
    return { features, users };
  } catch (error) {
    console.error("Error fetching features:", error);
    return { features: [], users: [] };
  }
}

export default function AdminFeatures({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resetFeature, setResetFeature] = useState<{ id: number; title: string } | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Clear forms on successful action
  useEffect(() => {
    if (actionData?.success && !isSubmitting) {
      setShowCreateForm(false);
      setResetFeature(null);
    }
  }, [actionData?.success, isSubmitting]);

  const features = loaderData?.features || [];
  const users = loaderData?.users || [];

  // Common page options for the dropdown
  const pageOptions = [
    { value: '/dashboard', label: 'Dashboard' },
    { value: '/settings', label: 'Settings' },
    { value: '/admin', label: 'Admin Panel' },
    { value: '/admin/users', label: 'User Management' },
    { value: '/admin/features', label: 'Feature Management' },
  ];

  return (
    <PageLayout title="Feature Management" headingSize="xl">
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
            <CsrfInput />
            <input type="hidden" name="action" value="create" />

            <div>
              <label className="block text-sm font-medium mb-1">Page</label>
              <FormSelect name="page" required>
                <option value="">Select a page</option>
                {pageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CSS Selector</label>
              <FormInput
                type="text"
                name="selector"
                required
                placeholder="e.g., #create-request-btn, .nav-item"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Feature Title</label>
              <FormInput
                type="text"
                name="title"
                required
                minLength={3}
                placeholder="Enter feature title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <FormTextarea
                name="description"
                required
                minLength={10}
                rows={3}
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
              <div key={feature.id} className="p-4 border border-gray-200/60 dark:border-gray-700/40 rounded-card-alt bg-white/50 dark:bg-emerald-950/30 hover:shadow-md transition-shadow duration-200">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 ml-4">
                    <span className="text-xs px-2 py-1 rounded-full border border-green-300 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                      Active
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="alert"
                        disabled={isSubmitting}
                        onClick={() => setResetFeature({ id: feature.id, title: feature.title })}
                        className="w-full sm:w-auto"
                      >
                        Reset
                      </Button>
                      <Form method="post" className="w-full sm:w-auto">
                        <CsrfInput />
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
                          className="w-full sm:w-auto"
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
      {/* Reset Dismissals Modal */}
      {resetFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setResetFeature(null); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-medium">Reset Dismissals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset dismissals for <strong>{resetFeature.title}</strong>
            </p>

            <Form method="post">
              <CsrfInput />
              <input type="hidden" name="action" value="clear-dismissals" />
              <input type="hidden" name="featureId" value={resetFeature.id} />
              <Button
                type="submit"
                variant="alert"
                disabled={isSubmitting}
                className="w-full"
                onClick={(e) => {
                  if (!confirm(`Clear all dismissals for "${resetFeature.title}"? All users will see this feature again.`)) {
                    e.preventDefault();
                  }
                }}
              >
                Reset for All Users
              </Button>
            </Form>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Form method="post" className="space-y-3">
                <CsrfInput />
                <input type="hidden" name="action" value="clear-dismissal-for-user" />
                <input type="hidden" name="featureId" value={resetFeature.id} />
                <FormSelect name="userId" required>
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </FormSelect>
                <Button
                  type="submit"
                  variant="warning"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Reset for User
                </Button>
              </Form>
            </div>

            <Button
              variant="info"
              onClick={() => setResetFeature(null)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
