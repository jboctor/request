import { RequestService } from './requestService';

export interface FormActionResult {
  success?: string;
  error?: string;
}

export class RequestActionService {
  static async handleFormAction(
    formData: FormData,
    userId?: number,
    isAdmin: boolean = false
  ): Promise<FormActionResult> {
    const requestId = formData.get("requestId");
    const action = formData.get("action");

    if (!requestId || !action) {
      return { error: "Missing request ID or action" };
    }

    if (action !== "complete" && action !== "delete") {
      return { error: "Invalid action" };
    }

    if (action === "complete" && !isAdmin) {
      return { error: "Only admins can complete requests" };
    }

    try {
      const id = parseInt(requestId as string, 10);
      if (isNaN(id)) {
        return { error: "Invalid request ID" };
      }

      if (action === "complete") {
        const updatedRequest = await RequestService.completeRequest(id);
        return { success: `Request "${updatedRequest.title}" marked as completed` };
      } 
      
      if (action === "delete") {
        const deletedRequest = await RequestService.deleteRequest(id, userId);
        return { success: `Request "${deletedRequest.title}" deleted successfully` };
      }

      return { error: "Invalid action" };
    } catch (error) {
      console.error("Error handling request action:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to process request" };
    }
  }
}