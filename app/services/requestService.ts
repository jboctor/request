import { database } from "~/database/context";
import { request as requestTable, requestMediaTypeEnum } from "~/database/schema";
import { eq, asc, desc, and } from "drizzle-orm";

export interface CreateRequestData {
  userId: number;
  title: string;
  mediaType: typeof requestMediaTypeEnum.enumValues[number];
}

export interface UpdateRequestData {
  dateCompleted?: Date;
  dateDeleted?: Date;
}

export class RequestService {
  private static db = database();

  // Get all requests (for admin)
  static async getAllRequests() {
    return await this.db
      .select({
        id: requestTable.id,
        title: requestTable.title,
        mediaType: requestTable.mediaType,
        userId: requestTable.userId,
        dateCreated: requestTable.dateCreated,
        dateCompleted: requestTable.dateCompleted,
        dateDeleted: requestTable.dateDeleted
      })
      .from(requestTable)
      .orderBy(
        asc(requestTable.dateCreated)
      );
  }

  // Get requests for a specific user (for dashboard)
  static async getUserRequests(userId: number) {
    return await this.db
      .select()
      .from(requestTable)
      .where(eq(requestTable.userId, userId))
      .orderBy(desc(requestTable.dateCreated));
  }

  // Create a new request
  static async createRequest(data: CreateRequestData) {
    await this.db.insert(requestTable).values({
      userId: data.userId,
      title: data.title.trim(),
      mediaType: data.mediaType
    });
  }

  // Mark request as completed (admin only)
  static async completeRequest(id: number) {
    const [updatedRequest] = await this.db
      .update(requestTable)
      .set({ dateCompleted: new Date() })
      .where(eq(requestTable.id, id))
      .returning({
        id: requestTable.id,
        title: requestTable.title
      });

    return updatedRequest;
  }

  // Soft delete a request (admin - any request, user - own request only)
  static async deleteRequest(id: number, userId?: number) {
    // Check if request exists and get its details
    const whereCondition = userId
      ? and(eq(requestTable.id, id), eq(requestTable.userId, userId))
      : eq(requestTable.id, id);

    const [existingRequest] = await this.db
      .select({
        id: requestTable.id,
        title: requestTable.title,
        dateCompleted: requestTable.dateCompleted
      })
      .from(requestTable)
      .where(whereCondition)
      .limit(1);

    if (!existingRequest) {
      throw new Error(userId ? "Request not found or you don't have permission to delete it" : "Request not found");
    }

    if (existingRequest.dateCompleted) {
      throw new Error("Cannot delete completed requests");
    }

    // Soft delete the request
    const [deletedRequest] = await this.db
      .update(requestTable)
      .set({ dateDeleted: new Date() })
      .where(whereCondition)
      .returning({
        id: requestTable.id,
        title: requestTable.title
      });

    return deletedRequest;
  }

  // Get a single request by ID
  static async getRequestById(id: number) {
    const [request] = await this.db
      .select()
      .from(requestTable)
      .where(eq(requestTable.id, id))
      .limit(1);

    return request;
  }

  // Validate media type
  static isValidMediaType(mediaType: string): mediaType is typeof requestMediaTypeEnum.enumValues[number] {
    return requestMediaTypeEnum.enumValues.includes(mediaType as any);
  }
}