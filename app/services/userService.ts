import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { PasswordManager } from "~/utils/password";
import { eq } from "drizzle-orm";

export interface CreateUserData {
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  dateDeleted: Date | null;
}

export class UserService {
  private static db = database();

  static async getAllUsers(): Promise<User[]> {
    const users = await this.db.query.user.findMany({
      columns: {
        id: true,
        username: true,
        isAdmin: true,
        dateDeleted: true,
      },
      orderBy: schema.user.id
    });

    return users;
  }

  static async createUser(data: CreateUserData): Promise<{ id: number; username: string; isAdmin: boolean }> {
    const existingUser = await this.db.query.user.findFirst({
      where: eq(schema.user.username, data.username),
      columns: { id: true, username: true }
    });

    if (existingUser) {
      throw new Error(`User with username "${data.username}" already exists`);
    }

    const salt = PasswordManager.generateSalt();
    const hashedPassword = await PasswordManager.hashPassword(data.password, salt);

    const [newUser] = await this.db.insert(schema.user).values({
      username: data.username,
      salt,
      password: hashedPassword,
      isAdmin: data.isAdmin,
    }).returning({
      id: schema.user.id,
      username: schema.user.username,
      isAdmin: schema.user.isAdmin
    });

    return newUser;
  }

  static async deleteUser(userId: number): Promise<void> {
    await this.db.update(schema.user)
      .set({ dateDeleted: new Date() })
      .where(eq(schema.user.id, userId));
  }

  static async restoreUser(userId: number): Promise<void> {
    await this.db.update(schema.user)
      .set({ dateDeleted: null })
      .where(eq(schema.user.id, userId));
  }

  static async toggleAdminStatus(userId: number): Promise<boolean> {
    const user = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      columns: { isAdmin: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const newAdminStatus = !user.isAdmin;
    await this.db.update(schema.user)
      .set({ isAdmin: newAdminStatus })
      .where(eq(schema.user.id, userId));

    return newAdminStatus;
  }

  static async resetPassword(userId: number, newPassword: string): Promise<void> {
    const salt = PasswordManager.generateSalt();
    const hashedPassword = await PasswordManager.hashPassword(newPassword, salt);

    await this.db.update(schema.user)
      .set({ salt, password: hashedPassword })
      .where(eq(schema.user.id, userId));
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 16) {
      return { isValid: false, error: "Password must be at least 16 characters long" };
    }

    return { isValid: true };
  }

  static async getUserByUsername(username: string): Promise<{
    id: number;
    username: string;
    salt: string;
    password: string;
    isAdmin: boolean;
    dateDeleted: Date | null;
  } | null> {
    const user = await this.db.query.user.findFirst({
      where: eq(schema.user.username, username),
      columns: {
        id: true,
        username: true,
        salt: true,
        password: true,
        isAdmin: true,
        dateDeleted: true
      }
    });

    return user || null;
  }

  static async getUserById(userId: number): Promise<{
    id: number;
    isAdmin: boolean;
    dateDeleted: Date | null;
  } | null> {
    const user = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      columns: {
        id: true,
        isAdmin: true,
        dateDeleted: true
      }
    });

    return user || null;
  }
}