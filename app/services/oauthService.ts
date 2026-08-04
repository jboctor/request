import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { PasswordManager } from "~/utils/password";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { InferSelectModel } from "drizzle-orm";

export type OAuthConfig = InferSelectModel<typeof schema.oauthConfig>;

export interface OAuthConfigData {
  providerName: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string;
  usernameClaim: string;
  enabled: boolean;
  autoCreateUsers: boolean;
}

export interface OAuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

const CALLBACK_PATH = "/auth/oauth/callback";

export class OAuthService {
  private static db = database();

  /**
   * The redirect URI that must be registered with the OAuth provider.
   * Derived from APP_URL so it matches the deployed origin.
   */
  static getRedirectUri(): string {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error("APP_URL environment variable is not set");
    }
    return `${appUrl.replace(/\/$/, "")}${CALLBACK_PATH}`;
  }

  static async getConfig(): Promise<OAuthConfig | null> {
    const config = await this.db.query.oauthConfig.findFirst({
      orderBy: schema.oauthConfig.id,
    });
    return config ?? null;
  }

  /**
   * Whether OAuth login is enabled and fully configured.
   */
  static async isEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(
      config?.enabled &&
      config.clientId &&
      config.clientSecret &&
      config.authorizationUrl &&
      config.tokenUrl &&
      config.userInfoUrl
    );
  }

  static async upsertConfig(data: OAuthConfigData): Promise<OAuthConfig> {
    const existing = await this.getConfig();

    if (existing) {
      const [updated] = await this.db
        .update(schema.oauthConfig)
        .set({ ...data, dateUpdated: new Date() })
        .where(eq(schema.oauthConfig.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(schema.oauthConfig)
      .values(data)
      .returning();
    return created;
  }

  /**
   * Build the provider authorization URL the user is redirected to.
   */
  static buildAuthorizationUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: this.getRedirectUri(),
      response_type: "code",
      scope: config.scopes,
      state,
    });

    const separator = config.authorizationUrl.includes("?") ? "&" : "?";
    return `${config.authorizationUrl}${separator}${params.toString()}`;
  }

  private static async exchangeCodeForToken(
    config: OAuthConfig,
    code: string
  ): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.getRedirectUri(),
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed (${response.status})`);
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new Error("Token exchange did not return an access token");
    }

    return data.access_token;
  }

  private static async fetchUserInfo(
    config: OAuthConfig,
    accessToken: string
  ): Promise<Record<string, unknown>> {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info (${response.status})`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  /**
   * Resolve the OAuth identity to a local user, optionally provisioning a new
   * one when auto-creation is enabled. Returns the session-ready user.
   */
  private static async resolveUser(
    config: OAuthConfig,
    userInfo: Record<string, unknown>
  ): Promise<OAuthUser> {
    const rawUsername = userInfo[config.usernameClaim];
    if (typeof rawUsername !== "string" || !rawUsername.trim()) {
      throw new Error(
        `OAuth provider did not return a "${config.usernameClaim}" value to use as a username`
      );
    }

    const username = rawUsername.trim();

    // When linking by an email claim, require the provider to assert the
    // address is verified. Otherwise someone could register at the IdP with an
    // unverified email matching an existing username and take over that account.
    if (config.usernameClaim === "email") {
      const emailVerified = userInfo.email_verified;
      if (emailVerified === false || emailVerified === "false") {
        throw new Error(
          "Your email address is not verified with the identity provider."
        );
      }
    }

    const existing = await this.db.query.user.findFirst({
      where: eq(schema.user.username, username),
      columns: { id: true, username: true, isAdmin: true, dateDeleted: true },
    });

    if (existing) {
      if (existing.dateDeleted) {
        throw new Error("This account has been disabled");
      }
      return {
        id: existing.id,
        username: existing.username,
        isAdmin: existing.isAdmin,
      };
    }

    if (!config.autoCreateUsers) {
      throw new Error(
        "No account matches this identity. Please contact an administrator."
      );
    }

    // Provision a new user with a random, unusable password (OAuth-only login).
    const salt = PasswordManager.generateSalt();
    const randomPassword = randomBytes(32).toString("hex");
    const hashedPassword = await PasswordManager.hashPassword(randomPassword, salt);

    const [created] = await this.db
      .insert(schema.user)
      .values({
        username,
        salt,
        password: hashedPassword,
        isAdmin: false,
      })
      .returning({
        id: schema.user.id,
        username: schema.user.username,
        isAdmin: schema.user.isAdmin,
      });

    return created;
  }

  /**
   * Complete the OAuth flow: exchange the code, fetch the profile, and resolve
   * it to a local user ready to be placed in the session.
   */
  static async handleCallback(config: OAuthConfig, code: string): Promise<OAuthUser> {
    const accessToken = await this.exchangeCodeForToken(config, code);
    const userInfo = await this.fetchUserInfo(config, accessToken);
    return this.resolveUser(config, userInfo);
  }
}
