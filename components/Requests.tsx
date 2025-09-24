import React from 'react';
import { Form, useNavigation } from 'react-router';
import { Button } from './Button';

interface Request {
  id: number;
  title: string;
  mediaType: string;
  userId: number;
  dateCreated: Date;
  dateCompleted: Date | null;
  dateDeleted: Date | null;
}

interface RequestsProps {
  requests: Request[];
  showPending: boolean;
  showCompleted: boolean;
  showDeleted: boolean;
  isAdmin?: boolean;
}

export function Requests({
  requests,
  showPending,
  showCompleted,
  showDeleted,
  isAdmin = false
}: RequestsProps) {
  const navigation = useNavigation();

  const filteredRequests = requests.filter((request) => {
    const isCompleted = request.dateCompleted !== null;
    const isDeleted = request.dateDeleted !== null;
    const isPending = !isCompleted && !isDeleted;

    if (isDeleted) return showDeleted;
    if (isCompleted) return showCompleted;
    if (isPending) return showPending;

    return false;
  });

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        {requests.length === 0 ? "No requests found." : "No requests match your current filters."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
                    {isAdmin && (
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
                    )}
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
      })}
    </div>
  );
}