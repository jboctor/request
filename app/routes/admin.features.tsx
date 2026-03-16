import type { Route } from "./+types/admin.features";
import { useState, useEffect, useRef } from "react";
import { useNavigation, Form, useSubmit, useRouteLoaderData } from "react-router";
import { Button } from "~/components/Button";
import { NewFeatureService } from "~/services/newFeatureService";
import { UserService } from "~/services/userService";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { SectionWrapper } from "~/components/SectionWrapper";
import { FormInput, FormSelect, FormTextarea } from "~/components/FormField";
import { PageLayout } from "~/components/PageLayout";
import { CsrfInput } from "~/components/CsrfInput";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { NewFeature } from "~/services/newFeatureService";

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

      case "reorder": {
        const orderedIdsJson = formData.get("orderedIds") as string;
        if (!orderedIdsJson) return { error: "Missing ordered IDs" };

        const orderedIds: number[] = JSON.parse(orderedIdsJson);
        await NewFeatureService.reorderFeatures(orderedIds);
        return { success: "Features reordered successfully" };
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

      case "clear-all-dismissals": {
        await NewFeatureService.clearAllDismissals();
        return { success: "All dismissals cleared for all features - users will see all features again" };
      }

      case "clear-all-dismissals-for-user": {
        const userId = parseInt(formData.get("userId") as string);
        if (!userId) return { error: "Please select a user" };

        await NewFeatureService.clearAllDismissalsForUser(userId);
        return { success: "All dismissals cleared for user - they will see all features again" };
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

function SortableFeatureCard({
  feature,
  isSubmitting,
  onReset,
}: {
  feature: NewFeature;
  isSubmitting: boolean;
  onReset: (feature: { id: number; title: string }) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 border border-gray-200/60 dark:border-gray-700/40 rounded-card-alt bg-white/50 dark:bg-emerald-950/30 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <button
            type="button"
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
            {...attributes}
            {...listeners}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
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
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 ml-4">
          <span className="text-xs px-2 py-1 rounded-full border border-green-300 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
            Active
          </span>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="alert"
              disabled={isSubmitting}
              onClick={() => onReset({ id: feature.id, title: feature.title })}
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
  );
}

export default function AdminFeatures({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submit = useSubmit();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resetFeature, setResetFeature] = useState<{ id: number; title: string } | null>(null);
  const [showResetAll, setShowResetAll] = useState(false);
  const createFormRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";

  const [featureOrder, setFeatureOrder] = useState<NewFeature[]>(loaderData?.features || []);

  useEffect(() => {
    setFeatureOrder(loaderData?.features || []);
  }, [loaderData?.features]);

  // Clear forms on successful action
  useEffect(() => {
    if (actionData?.success && !isSubmitting) {
      setShowCreateForm(false);
      setResetFeature(null);
      setShowResetAll(false);
    }
  }, [actionData?.success, isSubmitting]);

  const users = loaderData?.users || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFeatureOrder((items) => {
      const oldIndex = items.findIndex((f) => f.id === active.id);
      const newIndex = items.findIndex((f) => f.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      const formData = new FormData();
      formData.set("action", "reorder");
      formData.set("csrfToken", rootData?.csrfToken || "");
      formData.set("orderedIds", JSON.stringify(newOrder.map((f) => f.id)));
      submit(formData, { method: "post" });

      return newOrder;
    });
  }

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
        title={`Active Features (${featureOrder.length})`}
        actionData={actionData}
        filterControls={
          featureOrder.length > 0 ? (
            <Button
              variant="alert"
              disabled={isSubmitting}
              onClick={() => setShowResetAll(true)}
            >
              Reset All
            </Button>
          ) : <></>
        }
      >
        {!featureOrder.length ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No active features found.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={featureOrder.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {featureOrder.map((feature) => (
                  <SortableFeatureCard
                    key={feature.id}
                    feature={feature}
                    isSubmitting={isSubmitting}
                    onReset={setResetFeature}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
      {/* Reset All Dismissals Modal */}
      {showResetAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetAll(false); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-medium">Reset All Dismissals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset dismissals for <strong>all features</strong>
            </p>

            <Form method="post">
              <CsrfInput />
              <input type="hidden" name="action" value="clear-all-dismissals" />
              <Button
                type="submit"
                variant="alert"
                disabled={isSubmitting}
                className="w-full"
                onClick={(e) => {
                  if (!confirm("Clear all dismissals for all features? All users will see all features again.")) {
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
                <input type="hidden" name="action" value="clear-all-dismissals-for-user" />
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
              onClick={() => setShowResetAll(false)}
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
