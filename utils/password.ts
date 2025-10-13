import * as argon2 from "argon2";
import { randomBytes } from "crypto";

export class PasswordManager {
  private static readonly pepper = process.env.PASSWORD_PEPPER ?? "";

  static generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  static async hashPassword(password: string, salt: string): Promise<string> {
    const toHash = salt + password + this.pepper;
    return await argon2.hash(toHash);
  }

  static async verifyPassword(hash: string, password: string, salt: string): Promise<boolean> {
    const toVerify = salt + password + this.pepper;
    return await argon2.verify(hash, toVerify);
  }
}