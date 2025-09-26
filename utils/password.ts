import * as argon2 from "argon2";
import { randomBytes } from "crypto";

export class PasswordManager {
  private static readonly pepper = process.env.PASSWORD_PEPPER ?? "";

  /**
   * Generate a cryptographically secure salt
   */
  static generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Hash a password using salt and pepper
   * @param password - Plain text password
   * @param salt - Cryptographic salt
   */
  static async hashPassword(password: string, salt: string): Promise<string> {
    const toHash = salt + password + this.pepper;
    return await argon2.hash(toHash);
  }

  /**
   * Verify a password against its hash
   * @param hash - Stored password hash
   * @param password - Plain text password to verify
   * @param salt - Cryptographic salt
   */
  static async verifyPassword(hash: string, password: string, salt: string): Promise<boolean> {
    const toVerify = salt + password + this.pepper;
    return await argon2.verify(hash, toVerify);
  }
}