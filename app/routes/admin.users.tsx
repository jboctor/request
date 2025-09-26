import type { Route } from "./+types/admin.users";
import { useState, useEffect } from "react";
import { useNavigation, Form, useRouteLoaderData } from "react-router";
import { Button } from "~/components/Button";
import { UserService } from "~/services/userService";
import { FilteredItemsSection } from "~/components/FilteredItemsSection";
import { SectionWrapper } from "~/components/SectionWrapper";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Management - Admin Panel" },
    { name: "description", content: "Manage users and permissions" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  const action = formData.get("action") as string;
  const currentUserId = context?.session?.user?.id;

  try {
    switch (action) {
      case "create": {
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const isAdmin = formData.get("isAdmin") === "true";

        if (!username || username.length < 3) {
          return { error: "Username must be at least 3 characters long" };
        }
      
        if (!password || password.length < 16) {
          return { error: "Password must be at least 16 characters long" };
        }

        const newUser = await UserService.createUser({ username, password, isAdmin });
        return { success: `User '${newUser.username}' created successfully` };
      }

      case "delete": {
        const userId = parseInt(formData.get("userId") as string);
        if (!userId) return { error: "Invalid user ID" };

        if (userId === currentUserId) {
          return { error: "Cannot delete your own account" };
        }

        await UserService.deleteUser(userId);
        return { success: "User deleted successfully" };
      }

      case "restore": {
        const userId = parseInt(formData.get("userId") as string);
        if (!userId) return { error: "Invalid user ID" };

        await UserService.restoreUser(userId);
        return { success: "User restored successfully" };
      }

      case "toggle-admin": {
        const userId = parseInt(formData.get("userId") as string);
        if (!userId) return { error: "Invalid user ID" };

        // Check if this would leave no active admins
        const users = await UserService.getAllUsers();
        const activeAdmins = users.filter(user => user.isAdmin && !user.dateDeleted);
        const targetUser = users.find(user => user.id === userId);

        if (targetUser?.isAdmin && activeAdmins.length <= 1) {
          return { error: "Cannot remove admin privileges - at least one admin must remain" };
        }

        await UserService.toggleAdminStatus(userId);
        return { success: "User admin status updated" };
      }

      case "reset-password": {
        const userId = parseInt(formData.get("userId") as string);
        const newPassword = formData.get("newPassword") as string;

        if (!userId) return { error: "Invalid user ID" };

        const validation = UserService.validatePassword(newPassword);
        if (!validation.isValid) {
          return { error: validation.error };
        }

        await UserService.resetPassword(userId, newPassword);
        return { success: "Password reset successfully" };
      }

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("User management error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An error occurred while processing your request" };
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const users = await UserService.getAllUsers();
    const currentUserId = context?.session?.user?.id;
    const adminCount = users.filter(user => user.isAdmin && !user.dateDeleted).length;
    return {
      users,
      currentUserId,
      adminCount
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [], currentUserId: null, adminCount: 0 };
  }
}

export default function AdminUsers({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordResetFor, setShowPasswordResetFor] = useState<{[key: number]: boolean}>({});
  const [showActive, setShowActive] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdmins, setShowAdmins] = useState(true);
  const [showRegular, setShowRegular] = useState(true);

  const isSubmitting = navigation.state === "submitting";

  // Close password reset form on successful action
  useEffect(() => {
    if (actionData?.success) {
      setShowPasswordResetFor({});
    }
  }, [actionData?.success]);

  const filteredUsers = loaderData?.users?.filter((user) => {
    const isDeleted = user.dateDeleted !== null;
    const isActive = !isDeleted;
    const isAdmin = user.isAdmin;
    const isRegular = !user.isAdmin;

    // Filter by active/deleted status
    if (isDeleted && !showDeleted) return false;
    if (isActive && !showActive) return false;

    // Filter by admin status
    if (isAdmin && !showAdmins) return false;
    if (isRegular && !showRegular) return false;

    return true;
  }) || [];

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="sr-only">User Management</h1>
          <div className="w-[700px] max-w-[100vw] p-4">
            <h1 className="block w-full text-center text-2xl">User Management</h1>
          </div>
        </header>

        <div className="max-w-[700px] w-full space-y-6 px-4">
          {/* Create User Form */}
          <SectionWrapper>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Create User</h2>
              <Button
                variant={showCreateForm ? "alert" : "success"}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Cancel" : "Add User"}
              </Button>
            </div>

            {showCreateForm && (
              <Form method="post" className="space-y-4">
                <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                <input type="hidden" name="action" value="create" />
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    minLength={3}
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={16}
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    value="true"
                    id="isAdmin"
                    className="mr-2"
                  />
                  <label htmlFor="isAdmin" className="text-sm">Admin User</label>
                </div>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </Form>
            )}
          </SectionWrapper>

          {/* Users List */}
          <FilteredItemsSection
            title={`Users (${filteredUsers.length} of ${loaderData?.users?.length || 0})`}
            actionData={actionData}
            filterControls={
              <>
                <Button
                  variant={showActive ? "success" : "info"}
                  onClick={() => setShowActive(!showActive)}
                >
                  {showActive ? "Hide" : "Show"} Active ({loaderData?.users?.filter(u => !u.dateDeleted).length || 0})
                </Button>
                <Button
                  variant={showDeleted ? "alert" : "info"}
                  onClick={() => setShowDeleted(!showDeleted)}
                >
                  {showDeleted ? "Hide" : "Show"} Deleted ({loaderData?.users?.filter(u => u.dateDeleted).length || 0})
                </Button>
                <Button
                  variant={showAdmins ? "primary" : "info"}
                  onClick={() => setShowAdmins(!showAdmins)}
                >
                  {showAdmins ? "Hide" : "Show"} Admins ({loaderData?.users?.filter(u => u.isAdmin).length || 0})
                </Button>
                <Button
                  variant={showRegular ? "primary" : "info"}
                  onClick={() => setShowRegular(!showRegular)}
                >
                  {showRegular ? "Hide" : "Show"} Users ({loaderData?.users?.filter(u => !u.isAdmin).length || 0})
                </Button>
              </>
            }
          >
            {!filteredUsers.length ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {!loaderData?.users?.length ? "No users found." : "No users match your current filters."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const isDeleted = user.dateDeleted !== null;
                  const isCurrentUser = user.id === loaderData?.currentUserId;
                  const isLastAdmin = user.isAdmin && !isDeleted && loaderData?.adminCount === 1;

                  return (
                    <div key={user.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            User ID: {user.id}
                          </p>
                          {isDeleted && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Deleted
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {!isDeleted && showPasswordResetFor[user.id] ? (
                            // Show password reset form instead of buttons
                            <div className="w-full">
                              <Form method="post" className="flex flex-col gap-2">
                                <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                                <input type="hidden" name="action" value="reset-password" />
                                <input type="hidden" name="userId" value={user.id} />
                                <input
                                  type="password"
                                  name="newPassword"
                                  placeholder="Enter new password..."
                                  className="text-xs p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-gray-200"
                                  required
                                  minLength={16}
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    type="submit"
                                    variant="warning"
                                    loading={isSubmitting}
                                    className="text-xs px-2 py-1"
                                  >
                                    Reset Password
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="info"
                                    onClick={() => setShowPasswordResetFor(prev => ({ ...prev, [user.id]: false }))}
                                    className="text-xs px-2 py-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </Form>
                            </div>
                          ) : (
                            <>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isDeleted
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : user.isAdmin
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}>
                                {isDeleted ? "Deleted" : user.isAdmin ? "Admin" : "User"}
                              </span>
                              <div className="flex gap-2">
                                {isDeleted ? (
                                  <Form method="post" className="inline">
                                    <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                                    <input type="hidden" name="action" value="restore" />
                                    <input type="hidden" name="userId" value={user.id} />
                                    <Button
                                      type="submit"
                                      variant="success"
                                      disabled={isSubmitting}
                                    >
                                      Restore
                                    </Button>
                                  </Form>
                                ) : (
                                  <>
                                    <Form method="post" className="inline">
                                      <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                                      <input type="hidden" name="action" value="toggle-admin" />
                                      <input type="hidden" name="userId" value={user.id} />
                                      <Button
                                        type="submit"
                                        variant={user.isAdmin ? "warning" : "info"}
                                        disabled={isSubmitting || (user.isAdmin && isLastAdmin)}
                                      >
                                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                      </Button>
                                    </Form>

                                    <Button
                                      variant="warning"
                                      onClick={() => setShowPasswordResetFor(prev => ({ ...prev, [user.id]: true }))}
                                    >
                                      Reset Password
                                    </Button>

                                    <Form method="post" className="inline">
                                      <input type="hidden" name="csrfToken" value={rootData?.csrfToken || ""} />
                                      <input type="hidden" name="action" value="delete" />
                                      <input type="hidden" name="userId" value={user.id} />
                                      <Button
                                        type="submit"
                                        variant="alert"
                                        disabled={isSubmitting || isCurrentUser}
                                        onClick={(e) => {
                                          if (!confirm(`Are you sure you want to delete user '${user.username}'?`)) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </Form>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </FilteredItemsSection>
        </div>

      </div>
    </main>
  );
}