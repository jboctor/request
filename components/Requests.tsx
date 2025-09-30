import React, { useState } from 'react';
import { Form } from 'react-router';
import { Button } from './Button';

interface Request {
  id: number;
  title: string;
  mediaType: string;
  userId: number;
  dateCreated: Date;
  dateCompleted: Date | null;
  dateDeleted: Date | null;
  notes: string | null;
  dateCreatedFormatted: string;
  dateCompletedFormatted: string | null;
  dateDeletedFormatted: string | null;
}

interface RequestsProps extends React.HTMLAttributes<HTMLDivElement> {
  requests: Request[];
  showPending: boolean;
  showCompleted: boolean;
  showDeleted: boolean;
  isAdmin?: boolean;
  isSubmitting?: boolean;
  csrfToken?: string;
  sortOrder?: 'oldest' | 'newest';
}

export function Requests({
  requests,
  showPending,
  showCompleted,
  showDeleted,
  isAdmin = false,
  isSubmitting = false,
  csrfToken = "",
  sortOrder = 'newest',
  ...props
}: RequestsProps) {
  const [showNotesFor, setShowNotesFor] = useState<{[key: number]: 'complete' | 'delete' | null}>({});

  const filteredRequests = requests.filter((request) => {
    const isCompleted = request.dateCompleted !== null;
    const isDeleted = request.dateDeleted !== null;
    const isPending = !isCompleted && !isDeleted;

    if (isDeleted) return showDeleted;
    if (isCompleted) return showCompleted;
    if (isPending) return showPending;

    return false;
  }).sort((a, b) => {
    const aIsCompleted = a.dateCompleted !== null;
    const aIsDeleted = a.dateDeleted !== null;
    const aIsPending = !aIsCompleted && !aIsDeleted;

    const bIsCompleted = b.dateCompleted !== null;
    const bIsDeleted = b.dateDeleted !== null;
    const bIsPending = !bIsCompleted && !bIsDeleted;

    // Sort order: pending first, then completed, then deleted
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    if (aIsCompleted && bIsDeleted) return -1;
    if (aIsDeleted && bIsCompleted) return 1;

    // Within same status, sort by date created
    if (sortOrder === 'oldest') {
      return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
    } else {
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    }
  });

  if (filteredRequests.length === 0) {
    return (
      <div {...props} className="text-center text-gray-500 dark:text-gray-400 py-8">
        {requests.length === 0 ? "No requests found." : "No requests match your current filters."}
      </div>
    );
  }

  return (
    <div {...props} className="space-y-3">
      {filteredRequests.map((request) => {
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
                  Requested on {request.dateCreatedFormatted}
                </p>
                {isCompleted && request.dateCompletedFormatted && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Completed on {request.dateCompletedFormatted}
                  </p>
                )}
                {isDeleted && request.dateDeletedFormatted && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Deleted on {request.dateDeletedFormatted}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {status === "pending" && (showNotesFor[request.id] === 'complete' || (showNotesFor[request.id] === 'delete' && isAdmin)) ? (
                  // Show notes form instead of status pill and buttons
                  <div className="w-full">
                    {showNotesFor[request.id] === 'complete' ? (
                      <Form method="post" className="flex flex-col gap-2">
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="action" value="complete" />
                        <textarea
                          name="notes"
                          placeholder="Optional completion note..."
                          className="text-xs p-2 border border-gray-300 dark:border-gray-600 rounded resize-none dark:bg-gray-800 dark:text-gray-200"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Button
                            type="submit"
                            variant="success"
                            loading={isSubmitting}
                            className="text-xs px-2 py-1"
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            variant="info"
                            onClick={() => setShowNotesFor(prev => ({ ...prev, [request.id]: null }))}
                            className="text-xs px-2 py-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <Form method="post" className="flex flex-col gap-2">
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="action" value="delete" />
                        <textarea
                          name="notes"
                          placeholder="Optional deletion note..."
                          className="text-xs p-2 border border-gray-300 dark:border-gray-600 rounded resize-none dark:bg-gray-800 dark:text-gray-200"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Button
                            type="submit"
                            variant="alert"
                            loading={isSubmitting}
                            className="text-xs px-2 py-1"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              if (!confirm("Are you sure you want to delete this request?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            variant="info"
                            onClick={() => setShowNotesFor(prev => ({ ...prev, [request.id]: null }))}
                            className="text-xs px-2 py-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </Form>
                    )}
                  </div>
                ) : (
                  <>
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
                        {isAdmin && (
                          <Button
                            type="button"
                            variant="success"
                            onClick={() => setShowNotesFor(prev => ({ ...prev, [request.id]: 'complete' }))}
                          >
                            Complete
                          </Button>
                        )}
                        {isAdmin ? (
                          <Button
                            type="button"
                            variant="alert"
                            onClick={() => setShowNotesFor(prev => ({ ...prev, [request.id]: 'delete' }))}
                          >
                            Delete
                          </Button>
                        ) : (
                          <Form method="post" className="inline">
                            <input type="hidden" name="csrfToken" value={csrfToken} />
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="action" value="delete" />
                            <Button
                              type="submit"
                              variant="alert"
                              loading={isSubmitting}
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                if (!confirm("Are you sure you want to delete this request?")) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </Form>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {request.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500">
                  <strong>Note:</strong> {request.notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}