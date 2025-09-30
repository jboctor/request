import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { eq, and, notInArray } from "drizzle-orm";

export interface NewFeature {
  id: number;
  page: string;
  selector: string;
  title: string;
  description: string;
  dateCreated: Date;
  dateCreatedFormatted: string;
  isActive: boolean;
}

export interface CreateNewFeatureData {
  page: string;
  selector: string;
  title: string;
  description: string;
}

export class NewFeatureService {
  private static db = database();

  static async getUndismissedFeatures(userId: number): Promise<NewFeature[]> {
    const dismissedFeatures = await this.db
      .select({ featureId: schema.userFeatureDismissal.featureId })
      .from(schema.userFeatureDismissal)
      .where(eq(schema.userFeatureDismissal.userId, userId));

    const dismissedFeatureIds = dismissedFeatures.map(d => d.featureId);

    let features;
    if (dismissedFeatureIds.length > 0) {
      features = await this.db
        .select()
        .from(schema.newFeature)
        .where(
          and(
            eq(schema.newFeature.isActive, true),
            notInArray(schema.newFeature.id, dismissedFeatureIds)
          )
        );
    } else {
      features = await this.db
        .select()
        .from(schema.newFeature)
        .where(eq(schema.newFeature.isActive, true));
    }

    return features.map(feature => ({
      ...feature,
      dateCreatedFormatted: feature.dateCreated.toLocaleString('en-US')
    }));
  }

  static async getAllActiveFeatures(): Promise<NewFeature[]> {
    const features = await this.db
      .select()
      .from(schema.newFeature)
      .where(eq(schema.newFeature.isActive, true))
      .orderBy(schema.newFeature.dateCreated);

    return features.map(feature => ({
      ...feature,
      dateCreatedFormatted: feature.dateCreated.toLocaleString('en-US')
    }));
  }

  static async createFeature(data: CreateNewFeatureData): Promise<NewFeature> {
    const [newFeature] = await this.db
      .insert(schema.newFeature)
      .values({
        page: data.page,
        selector: data.selector,
        title: data.title,
        description: data.description,
      })
      .returning();

    return {
      ...newFeature,
      dateCreatedFormatted: newFeature.dateCreated.toLocaleString('en-US')
    };
  }

  static async dismissFeature(userId: number, featureId: number): Promise<void> {
    const existing = await this.db
      .select()
      .from(schema.userFeatureDismissal)
      .where(
        and(
          eq(schema.userFeatureDismissal.userId, userId),
          eq(schema.userFeatureDismissal.featureId, featureId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await this.db
        .insert(schema.userFeatureDismissal)
        .values({
          userId,
          featureId,
        });
    }
  }

  static async clearDismissal(userId: number, featureId: number): Promise<void> {
    await this.db
      .delete(schema.userFeatureDismissal)
      .where(
        and(
          eq(schema.userFeatureDismissal.userId, userId),
          eq(schema.userFeatureDismissal.featureId, featureId)
        )
      );
  }

  static async clearAllDismissalsForUser(userId: number): Promise<void> {
    await this.db
      .delete(schema.userFeatureDismissal)
      .where(eq(schema.userFeatureDismissal.userId, userId));
  }

  static async clearAllDismissalsForFeature(featureId: number): Promise<void> {
    await this.db
      .delete(schema.userFeatureDismissal)
      .where(eq(schema.userFeatureDismissal.featureId, featureId));
  }

  static async deactivateFeature(featureId: number): Promise<void> {
    await this.db
      .update(schema.newFeature)
      .set({ isActive: false })
      .where(eq(schema.newFeature.id, featureId));
  }

  static async getFeaturesForPage(pagePath: string, userId: number): Promise<NewFeature[]> {
    const dismissedFeatures = await this.db
      .select({ featureId: schema.userFeatureDismissal.featureId })
      .from(schema.userFeatureDismissal)
      .where(eq(schema.userFeatureDismissal.userId, userId));

    const dismissedFeatureIds = dismissedFeatures.map(d => d.featureId);

    let features;
    if (dismissedFeatureIds.length > 0) {
      features = await this.db
        .select()
        .from(schema.newFeature)
        .where(
          and(
            eq(schema.newFeature.isActive, true),
            eq(schema.newFeature.page, pagePath),
            notInArray(schema.newFeature.id, dismissedFeatureIds)
          )
        )
        .orderBy(schema.newFeature.dateCreated);
    } else {
      features = await this.db
        .select()
        .from(schema.newFeature)
        .where(
          and(
            eq(schema.newFeature.isActive, true),
            eq(schema.newFeature.page, pagePath)
          )
        )
        .orderBy(schema.newFeature.dateCreated);
    }

    return features.map(feature => ({
      ...feature,
      dateCreatedFormatted: feature.dateCreated.toLocaleString('en-US')
    }));
  }
}